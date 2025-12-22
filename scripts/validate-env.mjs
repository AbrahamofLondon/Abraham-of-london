#!/usr/bin/env node
/**
 * Environment Variable Validation Script
 * Validates that all required environment variables are present
 * Updated for Netlify compatibility with optional Vercel KV support
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Define required environment variables by environment
const REQUIRED_VARS = {
  development: [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_SITE_URL',
  ],
  production: [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  ],
  all: [
    // Variables required in all environments
  ]
};

// Define optional variables - NOT required for build to pass
const OPTIONAL_VARS = {
  development: [
    'RESEND_API_KEY',
    'MAIL_FROM',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'VERCEL_KV_REST_API_URL',
    'VERCEL_KV_REST_API_TOKEN',
    'INNER_CIRCLE_ADMIN_KEY',
    'ADMIN_USER_EMAIL',
    'ADMIN_USER_PASSWORD',
    'INNER_CIRCLE_KEY_EXPIRY_DAYS',
    'INNER_CIRCLE_DB_URL',
  ],
  production: [
    'RESEND_API_KEY',
    'MAIL_FROM',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'VERCEL_KV_REST_API_URL',
    'VERCEL_KV_REST_API_TOKEN',
    'INNER_CIRCLE_ADMIN_KEY',
    'ADMIN_USER_EMAIL',
    'ADMIN_USER_PASSWORD',
    'INNER_CIRCLE_KEY_EXPIRY_DAYS',
    'INNER_CIRCLE_DB_URL',
  ]
};

// Load .env file if it exists
function loadEnvFile() {
  const envPath = join(rootDir, '.env');
  const envLocalPath = join(rootDir, '.env.local');
  
  let envVars = {};
  
  // Try .env first
  if (existsSync(envPath)) {
    console.log(`📁 Loading: ${envPath}`);
    const content = readFileSync(envPath, 'utf-8');
    envVars = { ...envVars, ...parseEnvFile(content) };
  }
  
  // Then .env.local (overrides .env)
  if (existsSync(envLocalPath)) {
    console.log(`📁 Loading: ${envLocalPath}`);
    const content = readFileSync(envLocalPath, 'utf-8');
    envVars = { ...envVars, ...parseEnvFile(content) };
  }
  
  return envVars;
}

function parseEnvFile(content) {
  const vars = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      // Remove surrounding quotes but keep empty values
      const value = match[2].trim();
      const unquotedValue = value.replace(/^["']|["']$/g, '');
      vars[key] = unquotedValue;
    }
  }
  
  return vars;
}

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');
  
  const nodeEnv = process.env.NODE_ENV || 'development';
  const fileVars = loadEnvFile();
  const allVars = { ...fileVars, ...process.env };
  
  console.log(`🌍 Environment: ${nodeEnv}`);
  console.log(`📊 Total variables loaded: ${Object.keys(allVars).length}\n`);
  
  // Determine which required vars to check
  const requiredVars = [
    ...REQUIRED_VARS.all,
    ...(REQUIRED_VARS[nodeEnv] || [])
  ];
  
  // Determine which optional vars to check
  const optionalVars = [
    ...(OPTIONAL_VARS[nodeEnv] || [])
  ];
  
  const missingRequired = [];
  const presentRequired = [];
  const emptyRequired = [];
  
  // Check required variables
  for (const varName of requiredVars) {
    const value = allVars[varName];
    
    if (value === undefined || value === null) {
      missingRequired.push(varName);
    } else if (value.toString().trim() === '') {
      emptyRequired.push(varName);
    } else {
      presentRequired.push(varName);
    }
  }
  
  // Check optional variables
  const missingOptional = [];
  const presentOptional = [];
  
  for (const varName of optionalVars) {
    const value = allVars[varName];
    if (value === undefined || value === null || value.toString().trim() === '') {
      missingOptional.push(varName);
    } else {
      presentOptional.push(varName);
    }
  }
  
  // Report results - Required variables
  if (presentRequired.length > 0) {
    console.log('✅ Present REQUIRED variables:');
    presentRequired.forEach(v => {
      const val = allVars[v];
      const displayVal = v.includes('SECRET') || v.includes('KEY') || v.includes('TOKEN') 
        ? `${val.substring(0, 8)}...` 
        : val;
      console.log(`   - ${v}=${displayVal}`);
    });
    console.log('');
  }
  
  if (emptyRequired.length > 0) {
    console.log('⚠️  Empty REQUIRED variables (present but empty):');
    emptyRequired.forEach(v => console.log(`   - ${v}`));
    console.log('');
  }
  
  if (missingRequired.length > 0) {
    console.log('❌ Missing REQUIRED variables:');
    missingRequired.forEach(v => console.log(`   - ${v}`));
    console.log('');
  }
  
  // Report results - Optional variables
  if (presentOptional.length > 0) {
    console.log('✅ Present OPTIONAL variables:');
    presentOptional.forEach(v => {
      const val = allVars[v];
      const displayVal = v.includes('SECRET') || v.includes('KEY') || v.includes('TOKEN') 
        ? `${val.substring(0, 8)}...` 
        : val;
      console.log(`   - ${v}=${displayVal}`);
    });
    console.log('');
  }
  
  if (missingOptional.length > 0) {
    console.log('💡 Missing OPTIONAL variables (not required for build):');
    missingOptional.forEach(v => console.log(`   - ${v}`));
    console.log('');
  }
  
  // Validate specific formats
  console.log('🔍 Validating variable formats...\n');
  
  const formatWarnings = [];
  const formatErrors = [];
  
  // Validate DATABASE_URL format
  if (allVars.DATABASE_URL) {
    const dbUrl = allVars.DATABASE_URL;
    if (!dbUrl.startsWith('postgresql://') && 
        !dbUrl.startsWith('postgres://') && 
        !dbUrl.startsWith('file:')) {
      formatWarnings.push('DATABASE_URL should start with postgresql://, postgres://, or file:');
    }
  }
  
  // Validate NEXTAUTH_SECRET length
  if (allVars.NEXTAUTH_SECRET) {
    const secret = allVars.NEXTAUTH_SECRET;
    if (secret.length < 32) {
      formatErrors.push('NEXTAUTH_SECRET should be at least 32 characters long');
    } else if (secret.length === 32 && /^[a-f0-9]{32}$/i.test(secret)) {
      formatWarnings.push('NEXTAUTH_SECRET appears to be a simple MD5 hash. Consider using a more secure random string.');
    }
  }
  
  // Validate URLs (non-fatal if missing)
  const urlVars = ['NEXTAUTH_URL', 'NEXT_PUBLIC_SITE_URL', 'SUPABASE_URL'];
  for (const varName of urlVars) {
    if (allVars[varName] && allVars[varName].trim() !== '') {
      try {
        new URL(allVars[varName]);
      } catch {
        formatWarnings.push(`${varName} may not be a valid URL: "${allVars[varName]}"`);
      }
    }
  }
  
  // Validate email format for MAIL_FROM
  if (allVars.MAIL_FROM && allVars.MAIL_FROM.trim() !== '') {
    const emailMatch = allVars.MAIL_FROM.match(/<(.+?)>/);
    const email = emailMatch ? emailMatch[1] : allVars.MAIL_FROM;
    if (!email.includes('@') || !email.includes('.')) {
      formatWarnings.push(`MAIL_FROM may not be a valid email: "${allVars.MAIL_FROM}"`);
    }
  }
  
  // Report format issues
  if (formatErrors.length > 0) {
    console.log('❌ Format ERRORS (must fix):');
    formatErrors.forEach(v => console.log(`   - ${v}`));
    console.log('');
  }
  
  if (formatWarnings.length > 0) {
    console.log('⚠️  Format warnings (recommended to fix):');
    formatWarnings.forEach(v => console.log(`   - ${v}`));
    console.log('');
  }
  
  if (formatErrors.length === 0 && formatWarnings.length === 0) {
    console.log('✅ All variable formats valid\n');
  }
  
  // Final verdict
  const hasRequiredErrors = missingRequired.length > 0 || emptyRequired.length > 0 || formatErrors.length > 0;
  
  if (hasRequiredErrors) {
    console.log('❌ Environment validation FAILED\n');
    console.log('Please fix the issues above. You may need to:');
    console.log('1. Create a .env.local file with the missing variables');
    console.log('2. Update your Netlify environment variables');
    console.log('3. Check the .env.example file for reference\n');
    
    // Special Netlify guidance
    if (process.env.NETLIFY === 'true') {
      console.log('🌐 Netlify-specific guidance:');
      console.log('   - Go to Site Settings → Environment Variables');
      console.log('   - Add any missing required variables');
      console.log('   - Optional variables can be skipped if not needed\n');
    }
    
    process.exit(1);
  } else {
    console.log('✅ Environment validation PASSED\n');
    
    // Provide helpful next steps
    if (missingOptional.length > 0) {
      console.log('💡 Next steps:');
      console.log('   Some optional variables are missing but not required for build.');
      console.log('   Features using these variables may not work correctly.');
      
      // Special note about Vercel KV on Netlify
      if (missingOptional.includes('VERCEL_KV_REST_API_URL') && process.env.NETLIFY === 'true') {
        console.log('\n   Note: Vercel KV variables are missing.');
        console.log('   If you\'re not using Vercel KV, you can:');
        console.log('   1. Remove @vercel/kv from package.json dependencies');
        console.log('   2. Or add dummy values in Netlify environment variables');
      }
    }
    
    process.exit(0);
  }
}

// Run validation
try {
  validateEnvironment();
} catch (error) {
  console.error('❌ Unexpected error during environment validation:');
  console.error(error.message);
  console.error('\nStack trace:', error.stack);
  process.exit(1);
}