// scripts/generate-secrets.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generating secure secrets...\n');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generateBase64(length = 32) {
  return crypto.randomBytes(length).toString('base64').replace(/[+/=]/g, '');
}

const secrets = {
  // JWT Secrets (min 32 chars)
  INNER_CIRCLE_JWT_SECRET: generateSecret(32),
  JWT_SECRET: generateSecret(32),
  ADMIN_JWT_SECRET: generateSecret(32),
  NEXTAUTH_SECRET: generateSecret(32),
  
  // API Keys
  ADMIN_API_KEY: generateBase64(24),
  RESEND_API_KEY: 're_' + generateBase64(24).substring(0, 32),
  
  // Database password (example)
  DB_PASSWORD: generateSecret(16),
  
  // Redis password
  REDIS_PASSWORD: generateSecret(16),
};

console.log('✅ Generated secure secrets:\n');
console.log('Copy these to your .env.local or production environment:\n');

Object.entries(secrets).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});

console.log('\n📋 Usage:');
console.log('1. For development: Copy these to .env.local');
console.log('2. For production: Set these as environment variables');
console.log('3. Never commit secrets to version control!');
console.log('\n⚠️  Warning: Regenerate for each environment!');