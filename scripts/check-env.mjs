#!/usr/bin/env node
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function checkEnv() {
  console.log('🔍 Checking environment configuration...\n');
  
  // Check if .env files exist
  const envFiles = [
    { name: '.env', path: path.join(rootDir, '.env'), required: true },
    { name: '.env.local', path: path.join(rootDir, '.env.local'), required: false },
    { name: '.env.example', path: path.join(rootDir, '.env.example'), required: false }
  ];
  
  for (const file of envFiles) {
    const exists = await fileExists(file.path);
    const status = exists ? '✅' : file.required ? '❌' : '⚠️ ';
    console.log(`${status} ${file.name} ${exists ? '(found)' : '(missing)'}`);
  }
  
  // Load environment variables
  config({ path: path.join(rootDir, '.env') });
  config({ path: path.join(rootDir, '.env.local') });
  
  // Check required variables
  const requiredVars = [
    'DATABASE_URL',
    'INNER_CIRCLE_JWT_SECRET',
    'ADMIN_API_KEY'
  ];
  
  console.log('\n🔑 Checking required environment variables:');
  const missing = [];
  
  for (const key of requiredVars) {
    const value = process.env[key];
    const isSet = value && value.trim() !== '';
    const status = isSet ? '✅' : '❌';
    console.log(`${status} ${key}: ${isSet ? '[SET]' : 'MISSING'}`);
    
    if (!isSet) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    console.error(`\n❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('   Run: npm run env:setup');
    process.exit(1);
  }
  
  // Check database URL format
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    console.log('\n🔗 Database URL check:');
    if (dbUrl.includes('password') && dbUrl.includes('postgres')) {
      console.log('✅ Database URL contains PostgreSQL format');
    } else {
      console.log('⚠️  Database URL might need updating');
    }
    
    // Mask password for security
    const maskedUrl = dbUrl.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
    console.log(`   ${maskedUrl}`);
  }
  
  console.log('\n✅ All environment checks passed!');
}

checkEnv().catch((error) => {
  console.error('❌ Environment check failed:', error);
  process.exit(1);
});