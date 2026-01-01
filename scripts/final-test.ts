// scripts/final-test.ts
import dotenv from 'dotenv';
import path from 'path';
import { DatabaseClient } from '../lib/server/inner-circle';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function runTests() {
  console.log('🧪 Final system test...\n');
  
  // Test 1: Environment Variables
  console.log('📋 Environment Variables:');
  console.log('=========================');
  const envVars = [
    'NODE_ENV',
    'DATABASE_URL',
    'REDIS_URL',
    'SMTP_HOST',
    'NEXT_PUBLIC_SITE_URL'
  ];
  
  envVars.forEach(key => {
    const value = process.env[key];
    const status = value ? '✅' : '❌';
    console.log(`${status} ${key}: ${value || 'NOT SET'}`);
  });
  console.log('');
  
  // Test 2: Database Connection
  try {
    console.log('🔗 Testing Database Connection...');
    await DatabaseClient.initialize();
    
    // Test query to list tables
    const tables = await DatabaseClient.query<any>(
      'listTables',
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_type = 'BASE TABLE'`,
      [],
      []
    );
    
    if (Array.isArray(tables)) {
      console.log(`✅ Database working! Tables: ${tables.length}`);
      tables.forEach((table: any) => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      console.log('⚠️  Could not fetch table list');
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    // Clean up
    await DatabaseClient.close();
  }
  
  // Test 3: Additional system checks
  console.log('\n🖥️  System Information:');
  console.log('====================');
  console.log(`✅ Node.js version: ${process.version}`);
  console.log(`✅ Platform: ${process.platform}`);
  console.log(`✅ Current directory: ${process.cwd()}`);
  
  // Test 4: File system access
  try {
    const fs = require('fs');
    const envExists = fs.existsSync(path.join(__dirname, '..', '.env'));
    console.log(`${envExists ? '✅' : '❌'} .env file: ${envExists ? 'Found' : 'Missing'}`);
  } catch (error) {
    console.log('❌ Could not check .env file');
  }
}

runTests().catch(console.error);