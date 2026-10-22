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
};
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
