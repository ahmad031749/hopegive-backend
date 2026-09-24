import { readFileSync } from "fs";
import { join } from "path";
import { pool } from "../config/db";

async function migrate() {
  const sql = readFileSync(join(__dirname, "schema.sql"), "utf8");
  await pool.query(sql);
  console.log("✅ Migration complete");
  await pool.end();
}

migrate().catch((err) => { console.error(err); process.exit(1); });
