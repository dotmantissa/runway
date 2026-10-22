import { SuiGrpcClient } from '@mysten/sui/grpc';
import { GrpcTransport } from '@protobuf-ts/grpc-transport';
import { credentials } from '@grpc/grpc-js';
import { normalizeSuiAddress, normalizeStructTag } from '@mysten/sui/utils';
import { USDC } from '../../../../../packages/domain/src/index.js';
import { config } from '../../config.js';
import { AppError } from '../../services/state.js';
export interface ReceiptFacts { digest:string; recipient:string; sender:string; amountAtomic:string; coinType:string; checkpoint:string; settledAt:string; source:'tatum_verified'; provider:string }
export interface ChainAdapter { balance(address:string):Promise<{amountAtomic:string;checkedAt:string;source:'tatum_verified';provider:string}>; receipt(digest:string,address:string):Promise<ReceiptFacts> }
export class TatumAdapter implements ChainAdapter {
  private client?:SuiGrpcClient;
  private metadataVerified=false;
  private getClient() { if(!config.tatumKey)throw new AppError(503,'TATUM_UNCONFIGURED','Sui verification is not configured. Your existing numbers are still available.');
    if(!this.client)this.client=new SuiGrpcClient({network:'mainnet',transport:new GrpcTransport({host:new URL(config.tatumUrl).host,channelCredentials:credentials.createSsl(),meta:{'x-api-key':config.tatumKey},timeout:15000})});return this.client;
  }
  async metadata() { const result=await this.getClient().getCoinMetadata({coinType:USDC});if(result.coinMetadata?.decimals!==6)throw new AppError(503,'COIN_METADATA','The USDC metadata could not be verified.');this.metadataVerified=true;return result.coinMetadata; }
  async balance(address:string) { if(!this.metadataVerified)await this.metadata();const result=await this.getClient().getBalance({owner:normalizeSuiAddress(address),coinType:USDC});return {amountAtomic:result.balance.balance,checkedAt:new Date().toISOString(),source:'tatum_verified' as const,provider:config.tatumUrl}; }
  async receipt(digest:string,address:string):Promise<ReceiptFacts> {
    if(!this.metadataVerified)await this.metadata();
    const result=await this.getClient().getTransaction({digest,include:{balanceChanges:true,effects:true,transaction:true}});
    if(result.$kind!=='Transaction'||!result.Transaction.status.success)throw new AppError(422,'TRANSACTION_FAILED','This transaction did not complete successfully.');
    const tx=result.Transaction;
    if(!tx.checkpoint||!tx.timestampMs||!tx.effects||!tx.transaction||!tx.balanceChanges)throw new AppError(422,'INCOMPLETE_RECEIPT','This response does not contain enough confirmed transaction evidence.');
    const recipient=normalizeSuiAddress(address);
    const changes=tx.balanceChanges.filter(c=>normalizeSuiAddress(c.address)===recipient&&normalizeStructTag(c.coinType)===normalizeStructTag(USDC));
    const amount=changes.reduce((s,c)=>s+BigInt(c.amount),0n);
    if(amount<=0n)throw new AppError(422,'WRONG_RECEIPT','This transaction does not show an incoming native USDC balance change for your wallet.');
    // A net balance change proves credited funds, not arbitrary gross transfer legs.
    if(!tx.transaction.sender)throw new AppError(422,'INCOMPLETE_RECEIPT','The transaction sender is missing.');
    return {digest:tx.digest,recipient,sender:normalizeSuiAddress(tx.transaction.sender),amountAtomic:amount.toString(),coinType:USDC,checkpoint:tx.checkpoint,settledAt:new Date(tx.timestampMs).toISOString(),source:'tatum_verified',provider:config.tatumUrl};
  }
}
