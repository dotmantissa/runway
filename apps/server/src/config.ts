import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
if(existsSync(resolve('.env'))) {
  for(const line of readFileSync('.env','utf8').split('\n')) { const match=line.match(/^([A-Z_]+)=(.*)$/);if(match&&!process.env[match[1]])process.env[match[1]]=match[2].trim().replace(/^['"]|['"]$/g,''); }
}
export const config={port:Number(process.env.PORT||3001),origin:process.env.APP_ORIGIN||'http://localhost:5173',production:process.env.NODE_ENV==='production',databaseUrl:process.env.DATABASE_URL,dataDir:process.env.DATA_DIR||'.data',tatumKey:process.env.TATUM_API_KEY||'',tatumUrl:process.env.TATUM_GRPC_URL||'https://sui-mainnet-grpc.gateway.tatum.io',memoryKey:process.env.WALRUS_DELEGATE_KEY||'',memoryAccount:process.env.WALRUS_ACCOUNT_ID||'',memoryUrl:process.env.WALRUS_RELAYER_URL||'https://relayer.memory.walrus.xyz',memoryWrites:process.env.MEMORY_WRITES_ENABLED==='true',inlineWorker:process.env.INLINE_WORKER!=='false'};
if(config.production&&(!config.databaseUrl||!process.env.APP_ORIGIN||!config.origin.startsWith('https://')))throw new Error('Production requires DATABASE_URL and an HTTPS APP_ORIGIN.');
