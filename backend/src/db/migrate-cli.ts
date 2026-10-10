import { migrate } from "./migrate";
import { pool } from "./pool";

// `npm run db:migrate` targets the dev DB; `npm run db:migrate:test` the test DB
// (config.ts picks the URL based on NODE_ENV).
async function main() {
  try {
    await migrate(pool);
    console.log("Migration applied successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
