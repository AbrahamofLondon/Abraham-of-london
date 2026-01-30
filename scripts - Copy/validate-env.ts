#!/usr/bin/env node
/**
 * scripts/validate-env.mjs
 * ENTERPRISE-GRADE VALIDATOR
 * Purpose: Ensure the build pipeline has the necessary credentials to 
 * produce a deterministic and secure deployment.
 */

import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path'; // Added 'path' default import
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Required variables for structural integrity
const REQUIRED_VARS = {
  development: [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_SITE_URL',
  ],
  production: [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_SITE_URL',
    'RECAPTCHA_SECRET_KEY', // Critical for Netlify Function Guards
    'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  ],
  all: []
};

// Optional variables for feature-specific functionality
const OPTIONAL_VARS = {
  all: [
    'RESEND_API_KEY',
    'MAIL_FROM',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'ALLOW_RECAPTCHA_BYPASS', // Dev safety toggle
    'RECAPTCHA_MIN_SCORE',
  ]
};

function parseEnvFile(content) {
  const vars = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      vars[key] = value;
    }
  });
  return vars;
}

function validateEnvironment() {
  console.log('🔍 [VALIDATE]: Auditing environment variables...');
  
  const nodeEnv = process.env.NODE_ENV || 'development';
  const envPath = join(rootDir, '.env');
  const envLocalPath = join(rootDir, '.env.local');
  
  let fileVars = {};
  [envPath, envLocalPath].forEach(p => {
    if (existsSync(p)) {
      // path.basename is now safely accessible
      console.log(`📁 [LOAD]: ${path.basename(p)}`);
      fileVars = { ...fileVars, ...parseEnvFile(readFileSync(p, 'utf-8')) };
    }
  });

  const allVars = { ...fileVars, ...process.env };
  const required = [...REQUIRED_VARS.all, ...(REQUIRED_VARS[nodeEnv] || [])];
  
  const missing = required.filter(v => !allVars[v] || allVars[v].trim() === '');
  const present = required.filter(v => allVars[v] && allVars[v].trim() !== '');

  // 1. Report Presence
  if (present.length > 0) {
    console.log('\n✅ Present Required Variables:');
    present.forEach(v => {
      const isSecret = v.includes('SECRET') || v.includes('KEY');
      const val = allVars[v];
      console.log(`   - ${v}: ${isSecret ? '********' : val}`);
    });
  }

  // 2. Critical Format Checks
  console.log('\n🔍 [AUDIT]: Verifying security formats...');
  const errors = [];

  if (allVars.DATABASE_URL && !allVars.DATABASE_URL.includes('://')) {
    errors.push('DATABASE_URL is malformed (missing protocol)');
  }

  if (allVars.NEXTAUTH_SECRET && allVars.NEXTAUTH_SECRET.length < 32) {
    errors.push('NEXTAUTH_SECRET is too weak (minimum 32 characters)');
  }

  if (nodeEnv === 'production' && !allVars.RECAPTCHA_SECRET_KEY) {
    errors.push('RECAPTCHA_SECRET_KEY is missing (Guard logic will fail closed)');
  }

  // 3. Verdict
  if (missing.length > 0 || errors.length > 0) {
    if (missing.length > 0) {
      console.error('\n❌ Missing Required Variables:');
      missing.forEach(v => console.error(`   - ${v}`));
    }
    if (errors.length > 0) {
      console.error('\n❌ Security Format Errors:');
      errors.forEach(e => console.error(`   - ${e}`));
    }
    console.error('\n🚨 Environment validation failed. Fix the issues above to proceed.\n');
    process.exit(1);
  }

  console.log('\n✨ [SUCCESS]: Environment is mission-ready.\n');
  process.exit(0);
}

try {
  validateEnvironment();
} catch (e) {
  console.error('❌ Critical failure in validation script:', e.message);
  process.exit(1);
}
