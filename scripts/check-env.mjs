#!/usr/bin/env node
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function checkEnv() {
  console.log('🏛️  [INSTITUTIONAL AUDIT]: Checking Abraham of London Environment...\n');
  
  // 1. CONTENTLAYER RESOLUTION (CRITICAL FIX)
  console.log('📦 Testing Module Resolution Paths:');
  const mdxPaths = [
    { name: 'next-contentlayer/hooks', path: 'node_modules/next-contentlayer/dist/hooks.js' },
    { name: 'contentlayer/react', path: 'node_modules/contentlayer/dist/client/index.js' },
    { name: '.contentlayer generated', path: '.contentlayer/generated' }
  ];

  for (const pkg of mdxPaths) {
    const fullPath = path.join(rootDir, pkg.path);
    const exists = await fileExists(fullPath);
    console.log(`${exists ? '✅' : '❌'} ${pkg.name}: ${exists ? 'Found' : 'NOT FOUND'}`);
    if (!exists && pkg.name.includes('generated')) {
      console.warn('   ⚠️  Action: Run "pnpm contentlayer build" to generate brief data.');
    }
  }

  // 2. ENV FILE AUDIT
  console.log('\n📄 Checking Environment Files:');
  const envFiles = [
    { name: '.env', path: path.join(rootDir, '.env'), required: true },
    { name: '.env.local', path: path.join(rootDir, '.env.local'), required: false }
  ];
  
  for (const file of envFiles) {
    const exists = await fileExists(file.path);
    console.log(`${exists ? '✅' : '❌'} ${file.name} ${exists ? '(found)' : '(missing)'}`);
  }
  
  // Load variables
  config({ path: path.join(rootDir, '.env') });
  config({ path: path.join(rootDir, '.env.local') });
  
  // 3. VARIABLE VALIDATION
  const requiredVars = ['DATABASE_URL', 'INNER_CIRCLE_JWT_SECRET', 'ADMIN_API_KEY'];
  console.log('\n🔑 Validating Secrets:');
  
  for (const key of requiredVars) {
    const isSet = process.env[key] && process.env[key].trim() !== '';
    console.log(`${isSet ? '✅' : '❌'} ${key}: ${isSet ? '[SET]' : 'MISSING'}`);
  }
  
  // 4. VAULT INTEGRITY (The 75 Briefs)
  const contentDir = path.join(rootDir, 'content');
  const contentExists = await fileExists(contentDir);
  if (contentExists) {
    const files = await fs.readdir(contentDir);
    const mdxCount = files.filter(f => f.endsWith('.mdx')).length;
    console.log(`\n📚 Vault Status: Found ${mdxCount} MDX assets in content directory.`);
  }

  console.log('\n🏁 Audit Complete.');
}

checkEnv().catch((error) => {
  console.error('❌ Critical failure during audit:', error);
  process.exit(1);
});
