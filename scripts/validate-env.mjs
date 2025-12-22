#!/usr/bin/env node
/**
 * Environment Variable Validation Script
 * Validates that all required environment variables are present
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
  ],
  production: [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_SITE_URL',
  ],
  all: [
    // Variables required in all environments
  ]
};

// Define optional but recommended variables
const RECOMMENDED_VARS = [
  'RESEND_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'VERCEL_KV_URL',
  'VERCEL_KV_REST_API_URL',
  'VERCEL_KV_REST_API_TOKEN',
];

// Load .env file if it exists
function loadEnvFile() {
  const envPath = join(rootDir, '.env');
  const envLocalPath = join(rootDir, '.env.local');
  
  let envVars = {};
  
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    envVars = { ...envVars, ...parseEnvFile(content) };
  }
  
  if (existsSync(envLocalPath)) {
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
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      vars[key] = value;
    }
  }
  
  return vars;
}

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');
  
  const nodeEnv = process.env.NODE_ENV || 'development';
  const fileVars = loadEnvFile();
  const allVars = { ...fileVars, ...process.env };
  
  console.log(`Environment: ${nodeEnv}\n`);
  
  // Determine which required vars to check
  const requiredVars = [
    ...REQUIRED_VARS.all,
    ...(REQUIRED_VARS[nodeEnv] || [])
  ];
  
  const missing = [];
  const present = [];
  const empty = [];
  
  // Check required variables
  for (const varName of requiredVars) {
    const value = allVars[varName];
    
    if (!value) {
      missing.push(varName);
    } else if (value.trim() === '') {
      empty.push(varName);
    } else {
      present.push(varName);
    }
  }
  
  // Check recommended variables
  const missingRecommended = [];
  const presentRecommended = [];
  
  for (const varName of RECOMMENDED_VARS) {
    const value = allVars[varName];
    if (!value || value.trim() === '') {
      missingRecommended.push(varName);
    } else {
      presentRecommended.push(varName);
    }
  }
  
  // Report results
  if (present.length > 0) {
    console.log('✅ Present required variables:');
    present.forEach(v => console.log(`   - ${v}`));
    console.log('');
  }
  
  if (empty.length > 0) {
    console.log('⚠️  Empty required variables (present but empty):');
    empty.forEach(v => console.log(`   - ${v}`));
    console.log('');
  }
  
  if (missing.length > 0) {
    console.log('❌ Missing required variables:');
    missing.forEach(v => console.log(`   - ${v}`));
    console.log('');
  }
  
  if (presentRecommended.length > 0) {
    console.log('✅ Present recommended variables:');
    presentRecommended.forEach(v => console.log(`   - ${v}`));
    console.log('');
  }
  
  if (missingRecommended.length > 0) {
    console.log('💡 Missing recommended variables (optional):');
    missingRecommended.forEach(v => console.log(`   - ${v}`));
    console.log('');
  }
  
  // Validate specific formats
  console.log('🔍 Validating variable formats...\n');
  
  const formatValidations = [];
  
  // Validate DATABASE_URL
  if (allVars.DATABASE_URL) {
    const dbUrl = allVars.DATABASE_URL;
    if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
      formatValidations.push('DATABASE_URL should start with postgresql:// or postgres://');
    }
  }
  
  // Validate URLs
  const urlVars = ['NEXTAUTH_URL', 'NEXT_PUBLIC_SITE_URL', 'SUPABASE_URL'];
  for (const varName of urlVars) {
    if (allVars[varName]) {
      try {
        new URL(allVars[varName]);
      } catch {
        formatValidations.push(`${varName} is not a valid URL`);
      }
    }
  }
  
  // Validate NEXTAUTH_SECRET length
  if (allVars.NEXTAUTH_SECRET && allVars.NEXTAUTH_SECRET.length < 32) {
    formatValidations.push('NEXTAUTH_SECRET should be at least 32 characters long');
  }
  
  if (formatValidations.length > 0) {
    console.log('⚠️  Format warnings:');
    formatValidations.forEach(v => console.log(`   - ${v}`));
    console.log('');
  } else {
    console.log('✅ All variable formats valid\n');
  }
  
  // Final verdict
  const hasErrors = missing.length > 0 || empty.length > 0;
  
  if (hasErrors) {
    console.log('❌ Environment validation FAILED\n');
    console.log('Please create a .env.local file with the missing variables.');
    console.log('See .env.example for reference.\n');
    process.exit(1);
  } else {
    console.log('✅ Environment validation PASSED\n');
    process.exit(0);
  }
}

// Run validation
try {
  validateEnvironment();
} catch (error) {
  console.error('❌ Error during environment validation:', error.message);
  process.exit(1);
}