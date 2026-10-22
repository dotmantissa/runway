import { useEffect, useRef } from "react";
import {
  createDAppKit,
  DAppKitProvider,
  useCurrentAccount,
  useWalletConnection,
  useDAppKit,
} from "@mysten/dapp-kit-react";
import { ConnectButton } from "@mysten/dapp-kit-react/ui";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { api } from "./api.js";
import { Button, CTA, ErrorNote } from "./components.js";
const kit = createDAppKit({
  networks: ["mainnet"],
  createClient: () =>
    new SuiGrpcClient({
      network: "mainnet",
      baseUrl: "https://fullnode.mainnet.sui.io:443",
    }),
  slushWalletConfig: null,
});
function SignInContent() {
  const account = useCurrentAccount(),
    dapp = useDAppKit(),
    nav = useNavigate(),
    query = useQueryClient(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null);
  return (
    <div className="signin-panel">
      <h2>Your private workspace</h2>
      <ConnectButton />
      {account ? (
        <Button
          busy={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              const ch = await api("/auth/challenge", "POST", {
                address: account.address,
                network: "mainnet",
              });
              const signed = await dapp.signPersonalMessage({
                message: new TextEncoder().encode(ch.message),
              });
              await api("/auth/verify", "POST", {
                challengeId: ch.challengeId,
                ...signed,
              });
              query.clear();
              nav("/app/setup");
            } catch (e) {
              setError(e);
            } finally {
              setBusy(false);
            }
          }}
        >
          Sign in with this wallet <ArrowRight size={17} />
        </Button>
      ) : (
        <p className="helper">
          Choose a Mainnet Sui wallet, then sign the Runway message.
        </p>
      )}
      <ErrorNote error={error} />
      <div className="rule" />
      <CTA to="/demo" secondary>
        Try the example instead
      </CTA>
    </div>
  );
}
export default function WalletSignIn() {
  return (
    <DAppKitProvider dAppKit={kit}>
      <SignInContent />
    </DAppKitProvider>
  );
}
function Guard({ address }: { address: string }) {
  const account = useCurrentAccount(),
    connection = useWalletConnection(),
    query = useQueryClient(),
    nav = useNavigate(),
    previous = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (
      connection.status === "connecting" ||
      connection.status === "reconnecting"
    )
      return;
    const selected = account?.address ?? null;
    if (previous.current === undefined) {
      previous.current = selected;
      return;
    }
    if (
      (selected !== null && selected.toLowerCase() !== address.toLowerCase()) ||
      previous.current !== selected
    ) {
      previous.current = selected;
      void api("/auth/logout", "POST", {}).finally(() => {
        query.clear();
        nav("/signin");
      });
    }
  }, [account?.address, address, connection.status]);
  return null;
}
export function WalletGuard({ address }: { address: string }) {
  return (
    <DAppKitProvider dAppKit={kit}>
      <Guard address={address} />
    </DAppKitProvider>
  );
}
