import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { config } from "../config.js";
export interface SQL {
  query<T = any>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}
export class Database implements SQL {
  private pool?: pg.Pool;
  private embedded?: PGlite;
  private queue: Promise<unknown> = Promise.resolve();
  readonly mode: "postgres" | "embedded-postgres";
  constructor(url = config.databaseUrl, directory = config.dataDir) {
    this.mode = url ? "postgres" : "embedded-postgres";
    if (url)
      this.pool = new pg.Pool({
        connectionString: url,
        max: 5,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
        enableChannelBinding: true,
      } as pg.PoolConfig & { enableChannelBinding: boolean });
    else this.embedded = new PGlite(directory);
  }
  async initialize() {
    const dir = resolve("apps/server/src/db/migrations");
    const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
    const migrate = async (
      tx: SQL,
      execute: (sql: string) => Promise<unknown>,
    ) => {
      await execute(
        "CREATE TABLE IF NOT EXISTS migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
      );
      const applied = new Set(
        (
          await tx.query<{ version: number }>("SELECT version FROM migrations")
        ).rows.map((row) => row.version),
      );
      for (const file of files) {
        const version = Number(file.match(/^(\d+)_/)?.[1]);
        if (!Number.isInteger(version) || version < 1)
          throw new Error("Invalid migration filename: " + file);
        if (applied.has(version)) continue;
        await execute(await readFile(resolve(dir, file), "utf8"));
      }
    };
    if (this.pool) {
      await this.transaction(async (tx) => {
        // Server and worker can start together. Serialize DDL before either checks versions.
        await tx.query("SELECT pg_advisory_xact_lock(728194301)");
        await migrate(tx, (sql) => tx.query(sql));
      });
    } else {
      await this.exclusive(async () => {
        await this.embedded!.exec("BEGIN");
        try {
          await migrate(
            { query: (sql, params) => this.embedded!.query(sql, params) },
            (sql) => this.embedded!.exec(sql),
          );
          await this.embedded!.exec("COMMIT");
        } catch (error) {
          await this.embedded!.exec("ROLLBACK");
          throw error;
        }
      });
    }
  }
  async query<T = any>(
    sql: string,
    params: unknown[] = [],
  ): Promise<{ rows: T[] }> {
    if (this.pool) return this.pool.query(sql, params as any[]) as any;
    return this.exclusive(() => this.embedded!.query<T>(sql, params));
  }
  private async exclusive<T>(fn: () => Promise<T>): Promise<T> {
    const prior = this.queue;
    let release!: () => void;
    this.queue = new Promise<void>((r) => {
      release = r;
    });
    await prior;
    try {
      return await fn();
    } finally {
      release();
    }
  }
  async transaction<T>(fn: (tx: SQL) => Promise<T>): Promise<T> {
    if (this.pool) {
      const c = await this.pool.connect();
      try {
        await c.query("BEGIN");
        const value = await fn(c as SQL);
        await c.query("COMMIT");
        return value;
      } catch (e) {
        await c.query("ROLLBACK");
        throw e;
      } finally {
        c.release();
      }
    }
    return this.exclusive(async () => {
      await this.embedded!.exec("BEGIN");
      try {
        const value = await fn({
          query: async <T = any>(s: string, p: unknown[] = []) =>
            this.embedded!.query<T>(s, p),
        });
        await this.embedded!.exec("COMMIT");
        return value;
      } catch (e) {
        await this.embedded!.exec("ROLLBACK");
        throw e;
      }
    });
  }
  async close() {
    if (this.pool) await this.pool.end();
    else await this.embedded!.close();
  }
}
