import { Database } from "./db/index.js";
import { TatumAdapter } from "./adapters/tatum/index.js";
import { MemoryAdapter } from "./adapters/memwal/index.js";
import { runJobs } from "./jobs.js";
import { config } from "./config.js";
if (!config.databaseUrl)
  throw new Error(
    "A separate worker requires DATABASE_URL; use the inline worker for embedded PostgreSQL.",
  );
const db = new Database();
await db.initialize();
const chain = new TatumAdapter(),
  memory = new MemoryAdapter();
let stopped = false;
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    stopped = true;
  });
while (!stopped) {
  await runJobs(db, chain, memory);
  await new Promise((r) => setTimeout(r, 1000));
}
await db.close();
