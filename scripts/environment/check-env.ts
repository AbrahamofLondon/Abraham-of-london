/* scripts/environment/check-env.ts - Environment check script */
import fs from 'fs';
import path from 'path';

console.log('🔍 Checking environment configuration...');

const projectRoot = process.cwd();

// Check for required files
const requiredFiles = [
  '.env.local',
  'prisma/schema.prisma',
];

const optionalFiles = [
  '.env',
  '.env.development',
  '.env.production',
  '.env.staging',
];

console.log('\n📁 Checking required files:');
let allRequiredExist = true;

for (const file of requiredFiles) {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} (MISSING)`);
    allRequiredExist = false;
  }
}

console.log('\n📁 Checking optional files:');
for (const file of optionalFiles) {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`   📄 ${file} (${stats.size} bytes)`);
  } else {
    console.log(`   ⚪ ${file} (not present)`);
  }
}

// Check directory structure
console.log('\n📁 Checking directory structure:');
const requiredDirs = [
  'prisma',
  'public/pdfs',
  '.temp/pdfs',
  'scripts/environment',
];

for (const dir of requiredDirs) {
  const dirPath = path.join(projectRoot, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`   ✅ ${dir}/`);
  } else {
    console.log(`   ❌ ${dir}/ (MISSING)`);
    allRequiredExist = false;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (allRequiredExist) {
  console.log('✅ Environment check passed!');
  console.log('\n💡 Next: Run validation with: pnpm env:validate');
} else {
  console.error('❌ Environment check failed!');
  console.log('\n💡 Run these commands to fix:');
  console.log('1. pnpm env:setup (creates missing files)');
  console.log('2. pnpm db:setup (sets up database)');
  process.exit(1);
}