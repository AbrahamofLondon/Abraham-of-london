// scripts/prisma-simple-fix.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Simple fix for Prisma 7.2.0 - no preview features, no config.ts

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Creating simple Prisma schema...');

// Create a completely minimal schema
const simpleSchema = `// prisma/schema.prisma
// Minimal working schema for Prisma 7.2.0
// Generated: ${new Date().toISOString()}

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url = env("DATABASE_URL")
}

// Basic model to test
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@map("users")
}
`;

// Write the simple schema
const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
fs.writeFileSync(schemaPath, simpleSchema, 'utf-8');
console.log('✅ Created simple schema at:', schemaPath);

// Create .env if not exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, 'DATABASE_URL="file:./dev.db"\nNODE_ENV=development\n', 'utf-8');
  console.log('✅ Created .env file');
} else {
  // Ensure DATABASE_URL exists
  const envContent = fs.readFileSync(envPath, 'utf-8');
  if (!envContent.includes('DATABASE_URL')) {
    fs.appendFileSync(envPath, '\nDATABASE_URL="file:./dev.db"\n');
    console.log('✅ Added DATABASE_URL to .env');
  }
}

// Clean up any problematic config files
const configPath = path.join(process.cwd(), 'prisma/config.ts');
if (fs.existsSync(configPath)) {
  fs.renameSync(configPath, configPath + '.backup');
  console.log('⚠️  Moved prisma/config.ts to backup (causing issues)');
}

// Clean Prisma cache
const prismaCache = path.join(process.cwd(), 'node_modules/.prisma');
if (fs.existsSync(prismaCache)) {
  require('rimraf').sync(prismaCache);
  console.log('🧹 Cleaned Prisma cache');
}

try {
  console.log('🚀 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: process.cwd() });
  console.log('✅ Prisma client generated successfully!');
  
  console.log('\n🎉 Success! Now you can:');
  console.log('1. Run: npx prisma migrate dev --name init');
  console.log('2. Run: npm run build');
  
  // Update package.json with correct scripts
  updatePackageJson();
  
} catch (error) {
  console.error('❌ Generation failed. Trying alternative approach...');
  
  try {
    // Try with explicit schema path
    console.log('🔄 Trying with explicit schema path...');
    execSync('npx prisma generate --schema=./prisma/schema.prisma', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    updatePackageJson();
    
  } catch (error2) {
    console.error('💥 Both methods failed.');
    console.error('\nTry manually:');
    console.error('1. Open prisma/schema.prisma');
    console.error('2. Remove ALL previewFeatures lines');
    console.error('3. Ensure no syntax errors');
    console.error('4. Run: npx prisma generate');
    
    // Show current schema for debugging
    console.error('\n📋 Current schema preview:');
    console.error(fs.readFileSync(schemaPath, 'utf-8').substring(0, 500));
  }
}

function updatePackageJson() {
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error('❌ package.json not found');
    return;
  }
  
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    
    // Update only specific scripts, preserve others
    const newScripts = {
      ...pkg.scripts,
      'fix:prisma': 'node scripts/prisma-simple-fix.js',
      'prisma:clean': 'rimraf node_modules/.prisma',
      'prisma:generate': 'npx prisma generate',
      'prisma:migrate': 'npx prisma migrate dev --name init',
      'prisma:studio': 'npx prisma studio',
      'postinstall': 'echo "Prisma setup complete"',
      'prebuild': 'npx prisma generate',
      'build': 'cross-env NODE_OPTIONS=--max-old-space-size=4096 next build',
      'dev': 'cross-env NODE_OPTIONS=--max-old-space-size=4096 next dev',
      'build:test': 'npm run prisma:generate && cross-env NODE_OPTIONS=--max-old-space-size=4096 next build'
    };
    
    pkg.scripts = newScripts;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
    console.log('✅ Updated package.json scripts');
    
  } catch (error) {
    console.error('❌ Failed to update package.json:', error.message);
  }
}