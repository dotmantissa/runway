import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
if (existsSync(resolve(".env"))) process.loadEnvFile(resolve(".env"));
const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  APP_ORIGIN: z.url().default("http://localhost:5174"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().optional(),
  DATA_DIR: z.string().default(".data"),
  TATUM_API_KEY: z.string().default(""),
  TATUM_GRPC_URL: z.url().default("https://sui-mainnet-grpc.gateway.tatum.io"),
  WALRUS_DELEGATE_KEY: z.string().default(""),
  WALRUS_ACCOUNT_ID: z.string().default(""),
  WALRUS_RELAYER_URL: z.url().default("https://relayer.memory.walrus.xyz"),
  MEMORY_WRITES_ENABLED: z.enum(["true", "false"]).default("false"),
  INLINE_WORKER: z.enum(["true", "false"]).default("true"),
  JOB_MODE: z.enum(["inline", "scheduled"]).default("inline"),
  CRON_SECRET: z.string().default(""),
  ENABLE_AGENT_PAYMENTS: z.enum(["true", "false"]).default("false"),
  TOOL_WALLET_KEY: z.string().default(""),
  TOOL_ALLOWED_WALLETS: z.string().default(""),
  TOOL_MAX_GAS_MIST: z.coerce
    .number()
    .int()
    .min(1000000)
    .max(10000000)
    .default(5000000),
  TOOL_DAILY_GAS_MIST: z.coerce
    .number()
    .int()
    .min(1000000)
    .max(50000000)
    .default(20000000),
  PARSER_SERVICE_ENABLED: z.enum(["true", "false"]).default("false"),
  PARSER_SERVICE_URL: z.url().optional(),
  PARSER_RECIPIENT: z.string().default(""),
  PARSER_PAYMENT_SECRET: z.string().default(""),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success)
  throw new Error(
    "Invalid server configuration: " +
      parsed.error.issues.map((i) => i.path.join(".")).join(", "),
  );
const env = parsed.data;
for (const key of ["TATUM_GRPC_URL", "WALRUS_RELAYER_URL"] as const)
  if (new URL(env[key]).protocol !== "https:")
    throw new Error(key + " requires HTTPS.");
if (new URL(env.APP_ORIGIN).origin !== env.APP_ORIGIN)
  throw new Error(
    "APP_ORIGIN must be an exact origin without a path or trailing slash.",
  );
if (env.WALRUS_ACCOUNT_ID && !/^0x[0-9a-fA-F]{64}$/.test(env.WALRUS_ACCOUNT_ID))
  throw new Error(
    "WALRUS_ACCOUNT_ID must be a 32-byte hexadecimal account ID.",
  );
export const config = {
  port: env.PORT,
  origin: env.APP_ORIGIN,
  production: env.NODE_ENV === "production",
  databaseUrl: env.DATABASE_URL,
  dataDir: env.DATA_DIR,
  tatumKey: env.TATUM_API_KEY,
  tatumUrl: env.TATUM_GRPC_URL,
  memoryKey: env.WALRUS_DELEGATE_KEY,
  memoryAccount: env.WALRUS_ACCOUNT_ID,
  memoryUrl: env.WALRUS_RELAYER_URL,
  memoryWrites: env.MEMORY_WRITES_ENABLED === "true",
  inlineWorker: env.INLINE_WORKER === "true",
  jobMode: env.JOB_MODE,
  cronSecret: env.CRON_SECRET,
  agentPayments: env.ENABLE_AGENT_PAYMENTS === "true",
  toolWalletKey: env.TOOL_WALLET_KEY,
  toolAllowedWallets: env.TOOL_ALLOWED_WALLETS.split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean),
  toolMaxGas: env.TOOL_MAX_GAS_MIST,
  toolDailyGas: env.TOOL_DAILY_GAS_MIST,
  parserEnabled: env.PARSER_SERVICE_ENABLED === "true",
  parserUrl:
    env.PARSER_SERVICE_URL || env.APP_ORIGIN + "/api/v1/paid/invoice-parse",
  parserRecipient: env.PARSER_RECIPIENT.toLowerCase(),
  parserSecret: env.PARSER_PAYMENT_SECRET,
};
if (
  config.toolAllowedWallets.some((address) => !/^0x[0-9a-f]{64}$/.test(address))
)
  throw new Error(
    "TOOL_ALLOWED_WALLETS requires comma-separated full Sui addresses.",
  );
if (config.parserRecipient && !/^0x[0-9a-f]{64}$/.test(config.parserRecipient))
  throw new Error("PARSER_RECIPIENT requires a full Sui address.");
if ((config.parserEnabled || config.agentPayments) && !config.tatumKey)
  throw new Error(
    "Invoice agent payments and the paid parser require TATUM_API_KEY for settlement verification.",
  );
if (
  new URL(config.parserUrl).username ||
  new URL(config.parserUrl).password ||
  new URL(config.parserUrl).search ||
  new URL(config.parserUrl).hash
)
  throw new Error(
    "PARSER_SERVICE_URL cannot contain credentials, query parameters or fragments.",
  );
if (
  config.parserEnabled &&
  (!/^0x[0-9a-f]{64}$/.test(config.parserRecipient) ||
    config.parserSecret.length < 32)
)
  throw new Error(
    "The paid parser requires PARSER_RECIPIENT and a PARSER_PAYMENT_SECRET of at least 32 characters.",
  );
if (
  config.agentPayments &&
  (!config.toolWalletKey ||
    !config.toolAllowedWallets.length ||
    !config.parserRecipient)
)
  throw new Error(
    "Agent payments require a separate TOOL_WALLET_KEY, TOOL_ALLOWED_WALLETS and PARSER_RECIPIENT.",
  );
if (
  new URL(config.parserUrl).protocol !== "https:" &&
  (config.production || new URL(config.parserUrl).origin !== config.origin)
)
  throw new Error(
    "PARSER_SERVICE_URL requires HTTPS or the exact local development origin.",
  );
if (
  config.production &&
  (!config.databaseUrl ||
    !process.env.APP_ORIGIN ||
    !config.origin.startsWith("https://"))
)
  throw new Error("Production requires DATABASE_URL and an HTTPS APP_ORIGIN.");
if (
  config.jobMode === "scheduled" &&
  (!config.databaseUrl || config.cronSecret.length < 32)
)
  throw new Error(
    "Scheduled jobs require DATABASE_URL and a CRON_SECRET of at least 32 characters.",
  );
