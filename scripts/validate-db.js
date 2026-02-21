// scripts/validate-db.js
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'app.db');

console.log('🔍 Validating SQLite database...');
console.log(`📁 Database path: ${DB_PATH}`);

if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Database file not found!');
  process.exit(1);
}

try {
  const db = new Database(DB_PATH);
  
  // Check if tables exist
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `).all();

  console.log(`\n📊 Found ${tables.length} tables:`);
  tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    console.log(`   📋 ${table.name}: ${count.count} records`);
  });

  // Check migrations
  const migrations = db.prepare(`
    SELECT name, executed_at FROM _migrations 
    ORDER BY executed_at
  `).all();

  console.log(`\n🔄 Migrations executed: ${migrations.length}`);
  migrations.forEach(m => {
    console.log(`   ✅ ${m.name} (${m.executed_at})`);
  });

  db.close();
  console.log('\n✅ Database validation complete!');
  process.exit(0);
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
}