import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";

// A Wallet Standard bridge for repeatable browser demonstrations. The secret
// stays in the Node process; the page can request only Runway sign-in messages.
export async function installDemoWallet(context, baseURL) {
  if (!process.env.DEMO_WALLET_KEY) process.loadEnvFile(".env.submission");
  const decoded = decodeSuiPrivateKey(process.env.DEMO_WALLET_KEY);
  if (decoded.scheme !== "ED25519")
    throw new Error("Demo wallet must use Ed25519.");
  const key = Ed25519Keypair.fromSecretKey(decoded.secretKey);
  const address = key.toSuiAddress();
  const origin = new URL(baseURL).origin;
  let signatures = 0;
  await context.exposeBinding("__runwayDemoSign", async ({ page }, bytes) => {
    const message = new TextDecoder().decode(Uint8Array.from(bytes));
    if (
      new URL(page.url()).origin !== origin ||
      !message.startsWith(
        "Sign in to Runway\nOrigin: " +
          origin +
          "\nWallet: " +
          address +
          "\nNetwork: mainnet\n",
      ) ||
      !message.endsWith("This signs you in. It does not move funds.")
    )
      throw new Error("Demo wallet signs only this app's sign-in challenge.");
    signatures++;
    return key.signPersonalMessage(Uint8Array.from(bytes));
  });
  await context.addInitScript(
    ({ address, publicKey, origin }) => {
      if (location.origin !== origin) return;
      const account = {
        address,
        publicKey: Uint8Array.from(publicKey),
        chains: ["sui:mainnet"],
        features: ["sui:signPersonalMessage", "sui:signTransaction"],
        label: "Submission demo wallet",
      };
      let connected =
        sessionStorage.getItem("runway-demo-wallet-connected") === "true";
      const listeners = new Set();
      const wallet = {
        version: "1.0.0",
        name: "Runway Demo Wallet",
        icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTYiIGZpbGw9IiMyNzc0NDgiLz48dGV4dCB4PSIzMiIgeT0iNDQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjM0Ij5SPC90ZXh0Pjwvc3ZnPg==",
        chains: ["sui:mainnet"],
        get accounts() {
          return connected ? [account] : [];
        },
        features: {
          "sui:signTransaction": {
            version: "2.0.0",
            signTransaction: async () => {
              throw new Error("This demo wallet does not sign transactions.");
            },
          },
          "standard:connect": {
            version: "1.0.0",
            connect: async () => {
              connected = true;
              sessionStorage.setItem("runway-demo-wallet-connected", "true");
              listeners.forEach((fn) => fn({ accounts: [account] }));
              return { accounts: [account] };
            },
          },
          "standard:disconnect": {
            version: "1.0.0",
            disconnect: async () => {
              connected = false;
              sessionStorage.removeItem("runway-demo-wallet-connected");
              listeners.forEach((fn) => fn({ accounts: [] }));
            },
          },
          "standard:events": {
            version: "1.0.0",
            on: (event, fn) => {
              if (event === "change") listeners.add(fn);
              return () => listeners.delete(fn);
            },
          },
          "sui:signPersonalMessage": {
            version: "1.1.0",
            signPersonalMessage: async ({ message }) =>
              window.__runwayDemoSign(Array.from(message)),
          },
        },
      };
      const register = (api) => api.register(wallet);
      window.addEventListener("wallet-standard:app-ready", (event) =>
        register(event.detail),
      );
      window.dispatchEvent(
        new CustomEvent("wallet-standard:register-wallet", {
          detail: register,
        }),
      );
    },
    { address, publicKey: Array.from(key.getPublicKey().toRawBytes()), origin },
  );
  return { address, signatureCount: () => signatures };
}
