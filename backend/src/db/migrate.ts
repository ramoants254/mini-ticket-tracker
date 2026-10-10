import { readFileSync } from "node:fs";
import path from "node:path";
import type { Pool } from "pg";

// Resolved relative to the project root so it works from both src/ (tsx) and dist/.
const SCHEMA_PATH = path.resolve(__dirname, "../../src/db/schema.sql");

/** Applies schema.sql to the given pool. Idempotent. Reused by test setup. */
export async function migrate(pool: Pool): Promise<void> {
  const sql = readFileSync(SCHEMA_PATH, "utf8");
  await pool.query(sql);
}
