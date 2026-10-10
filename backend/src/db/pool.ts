import { Pool } from "pg";
import { config } from "../config";

export const pool = new Pool({ connectionString: config.databaseUrl });

// An idle client erroring (e.g. DB restart) must not crash the process.
pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});
