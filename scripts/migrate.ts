import { Database } from "../apps/server/src/db/index.js";
const db = new Database();
try {
  await db.initialize();
  const versions = (
    await db.query<{ version: number }>(
      "SELECT version FROM migrations ORDER BY version",
    )
  ).rows.map((row) => row.version);
  console.log(`Database migrations ${versions.join(", ")} ready (${db.mode}).`);
} finally {
  await db.close();
}
