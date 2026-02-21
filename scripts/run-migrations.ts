#!/usr/bin/env node
// scripts/run-migrations.ts
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(process.cwd(), "lib", "db", "migrations");
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "app.db");

interface Migration {
  name: string;
  executed_at: string;
}

function splitSql(sql: string): string[] {
  // A pragmatic SQLite-friendly splitter:
  // - splits on semicolons ONLY when not inside:
  //   - single/double-quoted strings
  //   - line comments (-- ...)
  //   - block comments (/* ... */)
  //   - CREATE TRIGGER ... BEGIN ... END; blocks
  const out: string[] = [];
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

function ensureMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function getExecutedMigrations(db: Database.Database): Set<string> {
  try {
    const rows = db.prepare('SELECT name FROM _migrations').all() as Migration[];
    return new Set(rows.map(r => r.name));
  } catch {
    // Table might not exist yet
    return new Set();
  }
}

function main() {
  const command = process.argv[2] || 'up';

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`❌ Migrations dir not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');

  if (command === 'status') {
    ensureMigrationsTable(db);
    const executed = getExecutedMigrations(db);
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    console.log('\n📊 Migration Status:');
    console.log(`Total migrations: ${files.length}`);
    console.log(`Executed: ${executed.size}`);
    console.log(`Pending: ${files.length - executed.size}`);
    
    console.log('\n📋 Details:');
    for (const file of files) {
      const status = executed.has(file) ? '✅' : '⏳';
      console.log(`  ${status} ${file}`);
    }
    
    db.close();
    return;
  }

  if (command === 'reset') {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Cannot reset database in production');
      process.exit(1);
    }
    db.close();
    fs.unlinkSync(DB_PATH);
    console.log('✅ Database reset. Run migrations again with: pnpm db:sqlite:migrate');
    return;
  }

  // Default: run migrations
  ensureMigrationsTable(db);
  const executed = getExecutedMigrations(db);
  
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let migrated = 0;

  for (const file of files) {
    if (executed.has(file)) {
      console.log(`⏭️  Skipping ${file} (already executed)`);
      continue;
    }

    const full = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(full, "utf8");

    const statements = splitSql(sql);
    console.log(`🚀 Running migration: ${file} (${statements.length} statements)`);

    // Run migration in a transaction
    const runMigration = db.transaction((fileName: string) => {
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        try {
          db.exec(stmt);
        } catch (err) {
          console.error(`\n❌ Failed in ${fileName} at statement #${i + 1}\n`);
          console.error(stmt.substring(0, 200) + (stmt.length > 200 ? '...' : ''));
          console.error("\nSQLite error:\n", err);
          throw err;
        }
      }
      
      // Record migration
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(fileName);
    });

    try {
      runMigration(file);
      migrated++;
      console.log(`✅ Completed ${file}`);
    } catch (err) {
      console.error(`❌ Migration failed: ${file}`);
      process.exit(1);
    }
  }

  db.close();
  
  if (migrated === 0) {
    console.log("✅ No pending migrations.");
  } else {
    console.log(`✅ Migrations complete. (${migrated} new migrations applied)`);
  }
}

main();