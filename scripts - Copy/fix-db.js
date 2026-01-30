// scripts/fix-db.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing database setup...\n');

try {
  // Check if dev.db exists
  const dbPath = path.join(__dirname, '..', 'dev.db');
  if (fs.existsSync(dbPath)) {
    console.log('✅ Database file exists:', dbPath);
    
    // Backup old database
    const backupPath = `${dbPath}.backup.${Date.now()}`;
    fs.copyFileSync(dbPath, backupPath);
    console.log(`📦 Created backup: ${backupPath}`);
  }
  
  // Run prisma commands
  console.log('\n1️⃣  Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  
  console.log('\n2️⃣  Pushing database schema...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  
  console.log('\n3️⃣  Generating types...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  
  console.log('\n🎉 Database fixed!');
  console.log('\n📋 Next: Run "npm run dev" to start the development server');
  
} catch (error) {
  console.error('❌ Fix failed:', error.message);
  process.exit(1);
}