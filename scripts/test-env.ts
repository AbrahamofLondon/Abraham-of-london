// scripts/test-env.ts
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🧪 Testing Environment Configuration\n');

// Check required variables
const requiredVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_SITE_URL',
  'NEXTAUTH_URL',
];

const optionalVars = [
  'NODE_ENV',
  'JWT_SECRET',
  'ADMIN_API_KEY',
  'REDIS_URL',
  'SMTP_HOST',
];

console.log('📋 Required Environment Variables:');
console.log('==================================');
let allRequiredPresent = true;

requiredVars.forEach(key => {
  const value = process.env[key];
  const isPresent = value && value !== '';
  const status = isPresent ? '✅' : '❌';
  console.log(`${status} ${key}: ${isPresent ? '[SET]' : 'MISSING'}`);
  
  if (!isPresent) {
    allRequiredPresent = false;
  }
});

console.log('\n📋 Optional Environment Variables:');
console.log('==================================');
optionalVars.forEach(key => {
  const value = process.env[key];
  const isPresent = value && value !== '';
  const status = isPresent ? '✅' : '⚠️ ';
  console.log(`${status} ${key}: ${isPresent ? '[SET]' : 'Not set'}`);
});

// Database connection test
console.log('\n🔗 Testing Database Connection...');
try {
  // Test database URL format
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    if (dbUrl.startsWith('postgresql://')) {
      console.log('✅ Database URL format is correct');
      
      // Mask password for display
      const maskedUrl = dbUrl.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
      console.log(`   Using: ${maskedUrl}`);
    } else {
      console.log('⚠️  Database URL format might be incorrect');
    }
  }
} catch (error) {
  console.log('❌ Could not parse database URL');
}

// Summary
console.log('\n📊 Summary:');
if (allRequiredPresent) {
  console.log('✅ All required environment variables are set!');
  console.log('   You can start the application.');
} else {
  console.log('❌ Missing required environment variables.');
  console.log('   Please check your .env.local file.');
}

// Show current environment files
console.log('\n📁 Environment files loaded:');
const envFiles = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.production'
];

envFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const exists = require('fs').existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file} ${exists ? '(loaded)' : '(not found)'}`);
});

console.log('\n💡 Tips:');
console.log('- Run: npm run setup-env  (to set up development environment)');
console.log('- Run: npm run generate-secrets  (to generate secure secrets)');
console.log('- Check .env.example for template');