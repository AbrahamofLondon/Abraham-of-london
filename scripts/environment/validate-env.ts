/* scripts/environment/validate-env.ts - Environment validation script */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

console.log('🔍 Validating environment configuration...');

const projectRoot = process.cwd();
const envLocalPath = path.join(projectRoot, '.env.local');
const envPath = path.join(projectRoot, '.env');

// Load environment
if (fs.existsSync(envLocalPath)) {
  console.log('📁 Loading .env.local');
  const envConfig = dotenv.config({ path: envLocalPath });
  dotenvExpand.expand(envConfig);
} else if (fs.existsSync(envPath)) {
  console.log('📁 Loading .env');
  const envConfig = dotenv.config({ path: envPath });
  dotenvExpand.expand(envConfig);
} else {
  console.error('❌ No environment file found. Run: pnpm env:setup');
  process.exit(1);
}

// Required variables for different environments
const requiredVariables = {
  all: [
    'NODE_ENV',
    'NEXT_PUBLIC_APP_ENV',
    'NEXT_PUBLIC_APP_NAME',
    'NEXT_PUBLIC_APP_URL',
    'DATABASE_URL',
    'NEXTAUTH_URL',
  ],
  production: [
    'NEXTAUTH_SECRET',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
  ],
  development: [],
};

// Validation rules
const validationRules: Record<string, (value: string) => { valid: boolean; message?: string }> = {
  NEXTAUTH_SECRET: (value) => ({
    valid: value.length >= 32,
    message: value.length < 32 ? 'NEXTAUTH_SECRET should be at least 32 characters' : undefined
  }),
  JWT_SECRET: (value) => ({
    valid: value.length >= 32,
    message: value.length < 32 ? 'JWT_SECRET should be at least 32 characters' : undefined
  }),
  ENCRYPTION_KEY: (value) => ({
    valid: value.length >= 32,
    message: value.length < 32 ? 'ENCRYPTION_KEY should be at least 32 characters' : undefined
  }),
  DATABASE_URL: (value) => ({
    valid: value.startsWith('file:') || value.startsWith('postgresql:') || value.startsWith('mysql:'),
    message: !value.startsWith('file:') && !value.startsWith('postgresql:') && !value.startsWith('mysql:') 
      ? 'DATABASE_URL should start with file:, postgresql:, or mysql:' 
      : undefined
  }),
  NEXT_PUBLIC_APP_URL: (value) => ({
    valid: value.startsWith('http://') || value.startsWith('https://'),
    message: !value.startsWith('http://') && !value.startsWith('https://')
      ? 'NEXT_PUBLIC_APP_URL should start with http:// or https://'
      : undefined
  }),
};

function validateEnvironment() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV || 'development';
  
  console.log(`\n📊 Environment: ${nodeEnv} (${appEnv})`);
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Check required variables
  const allRequired = [...requiredVariables.all];
  if (nodeEnv === 'production' || appEnv === 'production') {
    allRequired.push(...requiredVariables.production);
  }
  
  console.log('\n✅ Checking required variables:');
  for (const varName of allRequired) {
    const value = process.env[varName];
    if (!value) {
      console.error(`   ❌ ${varName} is not set`);
      hasErrors = true;
    } else {
      // Apply validation rules if any
      if (validationRules[varName]) {
        const result = validationRules[varName](value);
        if (!result.valid) {
          console.error(`   ❌ ${varName}: ${result.message}`);
          hasErrors = true;
        } else {
          console.log(`   ✓ ${varName} = ${varName.includes('SECRET') || varName.includes('KEY') ? '*****' : value}`);
        }
      } else {
        console.log(`   ✓ ${varName} = ${varName.includes('SECRET') || varName.includes('KEY') ? '*****' : value}`);
      }
    }
  }
  
  // Check for common issues
  console.log('\n🔧 Checking for common issues:');
  
  if (nodeEnv === 'production' && appEnv === 'development') {
    console.warn('   ⚠️  NODE_ENV=production but NEXT_PUBLIC_APP_ENV=development');
    hasWarnings = true;
  }
  
  if (process.env.NEXTAUTH_URL !== process.env.NEXT_PUBLIC_APP_URL) {
    console.warn('   ⚠️  NEXTAUTH_URL and NEXT_PUBLIC_APP_URL should match');
    hasWarnings = true;
  }
  
  if (process.env.DATABASE_URL?.includes('dev.db') && nodeEnv === 'production') {
    console.warn('   ⚠️  Using development database in production');
    hasWarnings = true;
  }
  
  // Check security in production
  if (nodeEnv === 'production' || appEnv === 'production') {
    console.log('\n🔒 Production security checks:');
    
    const defaultSecrets = [
      'your-super-secret-nextauth-key-change-this-in-production',
      'your-jwt-secret-key-change-this-in-production',
      'your-32-character-encryption-key-here',
      're_1234567890abcdefghijklmnopqrstuvwxyz',
      'dev-',
      'test-',
      'placeholder',
    ];
    
    const secretVars = ['NEXTAUTH_SECRET', 'JWT_SECRET', 'ENCRYPTION_KEY', 'RESEND_API_KEY'];
    
    for (const varName of secretVars) {
      const value = process.env[varName];
      if (value) {
        const isDefault = defaultSecrets.some(secret => value.includes(secret));
        if (isDefault) {
          console.error(`   ❌ ${varName} is using a default/placeholder value`);
          hasErrors = true;
        }
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 VALIDATION SUMMARY');
  console.log('='.repeat(50));
  
  if (hasErrors) {
    console.error('❌ Validation failed with errors');
    console.log('\n💡 Recommended actions:');
    console.log('1. Run: pnpm env:setup (if missing files)');
    console.log('2. Update .env.local with proper values');
    console.log('3. Set production secrets in your hosting platform');
    process.exit(1);
  } else if (hasWarnings) {
    console.warn('⚠️  Validation passed with warnings');
    console.log('\n💡 Check warnings above before deploying to production');
  } else {
    console.log('✅ All checks passed!');
  }
  
  // Environment info
  console.log('\n📊 Environment Information:');
  console.log(`   Node.js: ${process.version}`);
  console.log(`   Platform: ${process.platform}`);
  console.log(`   Arch: ${process.arch}`);
  console.log(`   Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB RSS`);
}

validateEnvironment();