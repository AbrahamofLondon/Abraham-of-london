import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const MIGRATIONS_DIR = path.join(process.cwd(), "lib", "db", "migrations");
const DB_PATH = path.join(process.cwd(), "dev.db"); // adjust if needed

function splitSql(sql) {
  // A pragmatic SQLite-friendly splitter:
  // - splits on semicolons ONLY when not inside:
  //   - single/double-quoted strings
  //   - line comments (-- ...)
  //   - block comments (/* ... */)
  //   - CREATE TRIGGER ... BEGIN ... END; blocks
  const out = [];
  let buf = "";

  let inSingle = false;
  let inDouble = false;
  let inLineComment = false;
  let inBlockComment = false;

  // Trigger block guard
  let inTrigger = false;
  let triggerBeginDepth = 0;

  const s = sql.replace(/\r\n/g, "\n");

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const next = s[i + 1] ?? "";

    // Handle line comments
    if (!inSingle && !inDouble && !inBlockComment) {
      if (!inLineComment && ch === "-" && next === "-") {
        inLineComment = true;
        buf += ch;
        continue;
      }
      if (inLineComment && ch === "\n") {
        inLineComment = false;
      }
    }

    // Handle block comments
    if (!inSingle && !inDouble && !inLineComment) {
      if (!inBlockComment && ch === "/" && next === "*") {
        inBlockComment = true;
        buf += ch;
        continue;
      }
      if (inBlockComment && ch === "*" && next === "/") {
        inBlockComment = false;
        buf += ch;
        buf += next;
        i++;
        continue;
      }
    }

    // Handle quotes (ignore inside comments)
    if (!inLineComment && !inBlockComment) {
      if (!inDouble && ch === "'" && s[i - 1] !== "\\") inSingle = !inSingle;
      if (!inSingle && ch === `"` && s[i - 1] !== "\\") inDouble = !inDouble;
    }

    // Detect start of CREATE TRIGGER (outside strings/comments)
    if (!inSingle && !inDouble && !inLineComment && !inBlockComment) {
      // crude but effective: look back a bit for "CREATE TRIGGER"
      if (!inTrigger) {
        const lookback = (buf + ch).slice(-40).toUpperCase();
        if (lookback.includes("CREATE TRIGGER")) {
          inTrigger = true;
          triggerBeginDepth = 0;
        }
      } else {
        // Track BEGIN/END inside trigger so we know when it finishes
        // SQLite triggers typically have one BEGIN ... END; block.
        const tail = (buf + ch).slice(-10).toUpperCase();

        // Count BEGIN tokens
        if (/\bBEGIN\b/.test(tail)) triggerBeginDepth++;

        // Count END tokens
        if (/\bEND\b/.test(tail) && triggerBeginDepth > 0) triggerBeginDepth--;
      }
    }

    buf += ch;

    // Statement boundary: semicolon not inside quote/comment.
    // If inside trigger, only allow split when we've closed BEGIN...END (depth==0)
    if (
      ch === ";" &&
      !inSingle &&
      !inDouble &&
      !inLineComment &&
      !inBlockComment &&
      (!inTrigger || triggerBeginDepth === 0)
    ) {
      const stmt = buf.trim();
      if (stmt) out.push(stmt);
      buf = "";

      // If we were in a trigger and just completed a statement, exit trigger mode
      if (inTrigger && triggerBeginDepth === 0) {
        inTrigger = false;
      }
    }
  }

  const tail = buf.trim();
  if (tail) out.push(tail.endsWith(";") ? tail : tail + ";");
  return out;
}

function main() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`Migrations dir not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const db = new Database(DB_PATH);

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const full = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(full, "utf8");

    const statements = splitSql(sql);
    console.log(`Running migration: ${file} (${statements.length} statements)`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        db.exec(stmt);
      } catch (err) {
        console.error(`\n❌ Failed in ${file} at statement #${i + 1}\n`);
        console.error(stmt);
        console.error("\nSQLite error:\n", err);
        process.exit(1);
      }
    }
  }

  db.close();
  console.log("✅ Migrations complete.");
}

main();
