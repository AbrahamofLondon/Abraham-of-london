/* scripts/database/setup-database.ts */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 Setting up database...');

const projectRoot = process.cwd();
const prismaDir = path.join(projectRoot, 'prisma');
const schemaPath = path.join(prismaDir, 'schema.prisma');

try {
  // 1. Check if schema exists
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ prisma/schema.prisma not found');
    console.log('💡 Create a schema file or run: pnpm env:setup');
    process.exit(1);
  }

  // 2. Generate Prisma client
  console.log('\n🔨 Generating Prisma client...');
  execSync('prisma generate', { 
    stdio: 'inherit', 
    cwd: projectRoot 
  });

  // 3. Push schema to database
  console.log('\n📤 Pushing database schema...');
  execSync('prisma db push --accept-data-loss', {
    stdio: 'inherit',
    cwd: projectRoot
  });

  // 4. Seed database
  console.log('\n🌱 Seeding database...');
  execSync('tsx scripts/database/seed-database.ts', {
    stdio: 'inherit',
    cwd: projectRoot
  });

  console.log('\n🎉 Database setup complete!');
  console.log('\n📝 Next steps:');
  console.log('  1. Run: pnpm dev');
  console.log('  2. Access Prisma Studio: pnpm prisma:studio');
  console.log('  3. Visit: http://localhost:5555 (for database GUI)');
  
} catch (error) {
  console.error('❌ Database setup failed:', error);
  process.exit(1);
}