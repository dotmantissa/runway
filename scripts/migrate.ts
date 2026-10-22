import { Database } from "../apps/server/src/db/index.js";
const db = new Database();
try {
  await db.initialize();
  console.log(`Database migration 001 applied (${db.mode}).`);
} finally {
  await db.close();
}
