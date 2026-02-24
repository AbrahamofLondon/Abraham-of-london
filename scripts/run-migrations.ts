#!/usr/bin/env node
// scripts/run-migrations.ts
import * as fs from "fs";
import * as path from "path";
import Database from "better-sqlite3";

const MIGRATIONS_DIR = path.join(process.cwd(), "lib", "db", "migrations");
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "app.db");

interface MigrationRecord {
  name: string;
  executed_at: string;
}

function splitSql(sql: string): string[] {
  // Simple but effective SQL splitter
  const statements: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  let inComment = false;
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const next = sql[i + 1];
    
    // Handle string literals
    if ((char === "'" || char === '"') && !inComment) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar && sql[i - 1] !== '\\') {
        inString = false;
      }
      current += char;
      continue;
    }
    
    // Handle comments
    if (!inString && char === '-' && next === '-') {
      inComment = true;
    }
    if (inComment && char === '\n') {
      inComment = false;
    }
    
    // Skip adding comment content
    if (inComment) {
      continue;
    }
    
    // Statement delimiter
    if (char === ';' && !inString) {
      const trimmed = current.trim();
      if (trimmed) {
        statements.push(trimmed);
      }
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add final statement
  const trimmed = current.trim();
  if (trimmed) {
    statements.push(trimmed);
  }
  
  return statements.filter(s => s.length > 0);
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
    const rows = db.prepare('SELECT name FROM _migrations ORDER BY executed_at').all() as MigrationRecord[];
    return new Set(rows.map(r => r.name));
  } catch {
    return new Set();
  }
}

function getMigrationFiles(): { name: string; path: string }[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }
  
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map(name => ({
      name,
      path: path.join(MIGRATIONS_DIR, name)
    }));
}

function main(): void {
  const command = process.argv[2] || 'up';
  const migrationName = process.argv[3];

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`❌ Migrations dir not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const migrationFiles = getMigrationFiles();

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  if (command === 'status') {
    ensureMigrationsTable(db);
    const executed = getExecutedMigrations(db);

    console.log('\n📊 Migration Status:');
    console.log(`Database: ${DB_PATH}`);
    console.log(`Total migrations: ${migrationFiles.length}`);
    console.log(`Executed: ${executed.size}`);
    console.log(`Pending: ${migrationFiles.length - executed.size}`);
    
    console.log('\n📋 Details:');
    
    const executedDetails = db.prepare('SELECT name, executed_at FROM _migrations ORDER BY executed_at').all() as MigrationRecord[];
    const executedMap = new Map(executedDetails.map(m => [m.name, m]));
    
    for (const file of migrationFiles) {
      const exec = executedMap.get(file.name);
      const status = exec ? '✅' : '⏳';
      const timestamp = exec ? ` (${new Date(exec.executed_at).toLocaleString()})` : '';
      console.log(`  ${status} ${file.name}${timestamp}`);
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

  if (command === 'create') {
    if (!migrationName) {
      console.error('❌ Please provide a migration name');
      console.log('Usage: pnpm db:sqlite:migrate create add_users_table');
      process.exit(1);
    }
    
    const date = new Date();
    const timestamp = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0') +
      date.getHours().toString().padStart(2, '0') +
      date.getMinutes().toString().padStart(2, '0');
    
    const filename = `${timestamp}_${migrationName.replace(/\s+/g, '_')}.sql`;
    const filepath = path.join(MIGRATIONS_DIR, filename);
    
    const template = `-- Migration: ${migrationName}
-- Created: ${new Date().toISOString()}

-- Write your SQL here

`;
    
    fs.writeFileSync(filepath, template);
    console.log(`✅ Created migration: ${filename}`);
    process.exit(0);
  }

  // Default: run migrations
  ensureMigrationsTable(db);
  const executed = getExecutedMigrations(db);
  
  const pending = migrationFiles.filter(f => !executed.has(f.name));

  if (pending.length === 0) {
    console.log("✅ No pending migrations.");
    db.close();
    return;
  }

  console.log(`🚀 Running ${pending.length} pending migrations...`);

  let migrated = 0;

  for (const file of pending) {
    const sql = fs.readFileSync(file.path, "utf8");
    const statements = splitSql(sql).filter(s => s.trim().length > 0);
    console.log(`\n📦 ${file.name} (${statements.length} statements)`);

    try {
      // Run migration in a transaction
      const runMigration = db.transaction(() => {
        for (let i = 0; i < statements.length; i++) {
          const stmt = statements[i];
          if (!stmt) continue;
          
          try {
            db.exec(stmt);
          } catch (err) {
            console.error(`\n❌ Failed in ${file.name} at statement #${i + 1}\n`);
            console.error(stmt.substring(0, 200) + (stmt.length > 200 ? '...' : ''));
            console.error("\nSQLite error:\n", err);
            throw err;
          }
        }
        
        // Record migration
        db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file.name);
      });

      runMigration();
      migrated++;
      console.log(`✅ Completed ${file.name}`);
    } catch (err) {
      console.error(`❌ Migration failed: ${file.name}`);
      db.close();
      process.exit(1);
    }
  }

  db.close();
  
  console.log(`\n✅ Migrations complete. (${migrated} new migrations applied)`);
}

main();