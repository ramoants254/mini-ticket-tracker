import { afterAll, beforeAll, beforeEach } from "vitest";
import { config } from "../src/config";
import { pool } from "../src/db/pool";
import { migrate } from "../src/db/migrate";

beforeAll(async () => {
  // Safety guard: these tests TRUNCATE the tickets table. Refuse to run
  // unless we are clearly pointed at a test database, never the dev one.
  const dbName = new URL(config.databaseUrl).pathname.slice(1);
  if (!dbName.endsWith("_test")) {
    throw new Error(`Refusing to run tests against "${dbName}": database name must end with "_test"`);
  }
  await migrate(pool);
});

beforeEach(async () => {
  await pool.query("TRUNCATE tickets RESTART IDENTITY");
});

afterAll(async () => {
  await pool.end();
});
