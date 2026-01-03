// scripts/environment/check-env.ts
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

async function fileExists(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function checkEnv() {
  console.log('🔍 Checking environment configuration...\n');
  
  // Check if .env files exist - look in ROOT directory, not scripts/
  const envFiles = [
    { name: '.env', path: path.join(rootDir, '..', '.env'), required: true },
    { name: '.env.local', path: path.join(rootDir, '..', '.env.local'), required: false },
    { name: '.env.example', path: path.join(rootDir, '..', '.env.example'), required: false }
  ];
  
  for (const file of envFiles) {
    const exists = await fileExists(file.path);
    const status = exists ? '✅' : file.required ? '❌' : '⚠️ ';
    console.log(`${status} ${file.name} ${exists ? '(found)' : '(missing)'}`);
  }
  
  // Load environment variables from ROOT directory
  config({ path: path.join(rootDir, '..', '.env') });
  config({ path: path.join(rootDir, '..', '.env.local') });
  
  // Check required variables
  const requiredVars = [
    'DATABASE_URL',
    'INNER_CIRCLE_JWT_SECRET',
    'ADMIN_API_KEY'
  ];
  
  console.log('\n🔑 Checking required environment variables:');
  const missing: string[] = [];
  
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
    
    // Check if we're looking in wrong directory
    const currentDir = process.cwd();
    console.error(`\n📁 Current working directory: ${currentDir}`);
    console.error(`📁 Script location: ${__dirname}`);
    
    // Try to find .env in current directory
    const envInCurrentDir = path.join(currentDir, '.env');
    const envExists = await fileExists(envInCurrentDir);
    
    if (envExists) {
      console.error(`\n💡 Found .env in current directory! Loading from: ${envInCurrentDir}`);
      config({ path: envInCurrentDir });
      
      // Check again after loading
      console.log('\n🔄 Re-checking after loading from current directory:');
      const stillMissing: string[] = [];
      for (const key of requiredVars) {
        const value = process.env[key];
        const isSet = value && value.trim() !== '';
        const status = isSet ? '✅' : '❌';
        console.log(`${status} ${key}: ${isSet ? '[SET]' : 'MISSING'}`);
        
        if (!isSet) {
          stillMissing.push(key);
        }
      }
      
      if (stillMissing.length === 0) {
        console.log('\n✅ All environment checks passed!');
        process.exit(0);
      }
    }
    
    console.error('\n💡 Quick fix - add these to your .env file:');
    console.error('INNER_CIRCLE_JWT_SECRET="your-secret-key-here"');
    console.error('ADMIN_API_KEY="your-admin-key-here"');
    console.error('\n⚠️  For production, set these in .env.local instead');
    process.exit(1);
  }
  
  console.log('\n✅ All environment checks passed!');
  console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
}

checkEnv().catch((error) => {
  console.error('❌ Environment check failed:', error);
  process.exit(1);
});