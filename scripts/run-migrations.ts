import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const MIGRATIONS_DIR = path.join(process.cwd(), "lib", "db", "migrations");
const DB_PATH = path.join(process.cwd(), "dev.db"); // adjust if needed

function main() {
  const db = new Database(DB_PATH);
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const full = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(full, "utf8");
    console.log(`Running migration: ${file}`);
    db.exec(sql);
  }

  db.close();
  console.log("Migrations complete.");
}

main();