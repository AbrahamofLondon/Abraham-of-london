// scripts/fix-db.mjs
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('🔧 Fixing database setup...\n');

try {
  // Check if dev.db exists
  const dbPath = path.join(rootDir, 'dev.db');
  if (fs.existsSync(dbPath)) {
    console.log('✅ Database file exists:', dbPath);
    
    // Backup old database
    const backupPath = `${dbPath}.backup.${Date.now()}`;
    fs.copyFileSync(dbPath, backupPath);
    console.log(`📦 Created backup: ${backupPath}`);
  }
  
  // Run prisma commands
  console.log('\n1️⃣  Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: rootDir });
  
  console.log('\n2️⃣  Pushing database schema...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: rootDir });
  
  console.log('\n3️⃣  Generating types...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: rootDir });
  
  console.log('\n🎉 Database fixed!');
  console.log('\n📋 Next: Run "npm run dev" to start the development server');
  
} catch (error) {
  console.error('❌ Fix failed:', error.message);
  process.exit(1);
}