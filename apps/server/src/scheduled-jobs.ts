import type { Database } from "./db/index.js";
import type { ChainAdapter } from "./adapters/tatum/index.js";
import type { MemoryAdapter } from "./adapters/memwal/index.js";
import { runJobs } from "./jobs.js";

export function scheduledJobs(
  db: Database,
  chain: ChainAdapter,
  memory: MemoryAdapter,
) {
  let active: Promise<number> | undefined;
  return () => {
    if (active) return active;
    const drain = async () => {
      const deadline = Date.now() + 60000;
      let completed = 0;
      while (Date.now() < deadline && completed < 10) {
        if (await runJobs(db, chain, memory)) completed++;
        else {
          const pending = (
            await db.query(
              "SELECT 1 FROM jobs WHERE status='queued' AND run_after<=now()+interval '5 seconds' LIMIT 1",
            )
          ).rows.length;
          if (!pending) break;
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      return completed;
    };
    active = drain().finally(() => {
      active = undefined;
    });
    return active;
  };
}
