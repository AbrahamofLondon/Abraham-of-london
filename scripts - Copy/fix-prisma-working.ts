#!/usr/bin/env tsx
// scripts/fix-prisma-working.ts
// Working fix for Prisma 7.2.0 - removes problematic features

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing Prisma 7.2.0 compatibility...');

// Backup existing schema
const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
const backupPath = path.resolve(process.cwd(), 'prisma/schema.backup.prisma');

if (fs.existsSync(schemaPath)) {
  fs.copyFileSync(schemaPath, backupPath);
  console.log('📋 Backed up schema to prisma/schema.backup.prisma');
}

// Read current schema
let schema = fs.existsSync(schemaPath) 
  ? fs.readFileSync(schemaPath, 'utf-8')
  : '';

// Remove all previewFeatures (causing issues in 7.2.0)
schema = schema.replace(/previewFeatures\s*=\s*\[[^\]]*\]/g, '');
schema = schema.replace(/previewFeatures\s*=\s*\[.*?\]/gs, '');

// Remove any remaining problematic lines
const lines = schema.split('\n');
const cleanLines = lines.filter(line => {
  // Keep only valid lines
  if (line.trim().startsWith('previewFeatures')) return false;
  if (line.includes('"metrics"')) return false;
  if (line.includes('"fullTextSearch"')) return false;
  if (line.includes('binaryTargets') && line.includes('rhel-openssl')) {
    // Simplify binaryTargets
    return line.replace(/".*?rhel-openssl.*?"/g, '');
  }
  return true;
});

// Ensure generator block is simple
let inGenerator = false;
let generatorLines: string[] = [];
let otherLines: string[] = [];

for (const line of cleanLines) {
  if (line.includes('generator client')) inGenerator = true;
  if (inGenerator && line.trim().startsWith('}')) {
    inGenerator = false;
    generatorLines.push(line);
    continue;
  }
  
  if (inGenerator) {
    // Only keep essential generator properties
    if (line.includes('provider = "prisma-client-js"')) {
      generatorLines.push(line);
    }
    // Skip all other generator config for now
  } else {
    otherLines.push(line);
  }
}

// Create clean schema
const cleanSchema = `// prisma/schema.prisma
// Clean schema for Prisma 7.2.0
// Generated: ${new Date().toISOString()}

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url = env("DATABASE_URL")
}

${otherLines.join('\n').replace(/datasource db\s*{[^}]*}/gs, '')}`;

// Write clean schema
fs.writeFileSync(schemaPath, cleanSchema, 'utf-8');
console.log('✅ Created clean schema for Prisma 7.2.0');

// Remove config.ts if it exists (causing issues)
const configPath = path.resolve(process.cwd(), 'prisma/config.ts');
if (fs.existsSync(configPath)) {
  fs.renameSync(configPath, configPath + '.backup');
  console.log('⚠️  Moved prisma/config.ts to backup (simpler setup)');
}

// Ensure .env exists
const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, 'DATABASE_URL="file:./dev.db"\nNODE_ENV=development\n', 'utf-8');
  console.log('✅ Created .env file');
}

// Clean Prisma cache
const prismaCache = path.resolve(process.cwd(), 'node_modules/.prisma');
if (fs.existsSync(prismaCache)) {
  try {
    require('rimraf').sync(prismaCache);
    console.log('🧹 Cleaned Prisma cache');
  } catch (error) {
    console.log('⚠️  Could not clean cache, continuing...');
  }
}

// Generate Prisma client
try {
  console.log('🚀 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: process.cwd() });
  console.log('✅ Prisma client generated successfully!');
} catch (error) {
  console.error('❌ Generation failed. Trying alternative...');
  
  // Try with direct schema
  try {
    execSync('npx prisma generate --schema=./prisma/schema.prisma', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ Prisma client generated (alternative method)');
  } catch (error2) {
    console.error('💥 All generation methods failed.');
    console.error('\n📋 Manual steps:');
    console.error('1. Delete prisma/config.ts if exists');
    console.error('2. Remove ALL previewFeatures from schema.prisma');
    console.error('3. Run: npx prisma generate');
    process.exit(1);
  }
}

console.log('\n🎉 Prisma 7.2.0 fix complete!');
console.log('\n📋 Next steps:');
console.log('1. Run: npx prisma migrate dev --name init');
console.log('2. Run: npm run build');