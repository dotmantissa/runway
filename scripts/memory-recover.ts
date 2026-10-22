import { parseArgs } from "node:util";
import { Database } from "../apps/server/src/db/index.js";
import { config } from "../apps/server/src/config.js";
import { MemoryAdapter } from "../apps/server/src/adapters/memwal/index.js";
import { recoverMemory } from "../apps/server/src/services/memory-recovery.js";
import { AppError } from "../apps/server/src/services/state.js";

const usage =
  "pnpm memory:recover --workspace <id> --record <id> [--remote-job <existing-id>] [--apply]";
let db: Database | undefined;
try {
  const { values } = parseArgs({
    options: {
      workspace: { type: "string" },
      record: { type: "string" },
      "remote-job": { type: "string" },
      apply: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });
  if (values.help) console.log(usage);
  else {
    if (!values.workspace?.trim() || !values.record?.trim())
      throw new AppError(400, "ARGUMENTS_REQUIRED", usage);
    if (!config.databaseUrl)
      throw new AppError(
        400,
        "POSTGRES_REQUIRED",
        "Recovery requires DATABASE_URL for the existing PostgreSQL database. Do not open a running embedded store from another process.",
      );
    db = new Database();
    // Deliberately do not migrate: inspection must not mutate the database.
    const result = await recoverMemory(db, new MemoryAdapter(), {
      workspaceId: values.workspace,
      recordId: values.record,
      remoteJobId: values["remote-job"],
      apply: values.apply,
    });
    console.log(JSON.stringify(result, null, 2));
  }
} catch (error) {
  // Provider and database exception messages can contain private URLs or financial content.
  console.error(
    String((error as { code?: string })?.code).startsWith("ERR_PARSE_ARGS")
      ? usage
      : error instanceof AppError
        ? error.message
        : "Memory recovery could not complete. Check database connectivity and relayer availability; no new memory was submitted.",
  );
  process.exitCode = 1;
} finally {
  await db?.close();
}
