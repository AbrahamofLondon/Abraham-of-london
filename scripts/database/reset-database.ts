/* scripts/database/reset-database.ts */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔄 Resetting database...');

const projectRoot = process.cwd();
const prismaDir = path.join(projectRoot, 'prisma');
const dbPath = path.join(prismaDir, 'dev.db');

try {
  // Check if SQLite database exists
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('🗑️  Deleted existing database');
  }

  // Run setup again
  console.log('\n🔨 Running database setup...');
  execSync('pnpm db:setup', { stdio: 'inherit', cwd: projectRoot });

  console.log('\n✅ Database reset complete!');
} catch (error) {
  console.error('❌ Database reset failed:', error);
  process.exit(1);
}