#!/usr/bin/env node
import crypto from 'crypto';

console.log('🔐 Generating secure secrets for Abraham of London\n');

const secrets = {
  INNER_CIRCLE_JWT_SECRET: crypto.randomBytes(32).toString('hex'),
  JWT_SECRET: crypto.randomBytes(32).toString('hex'),
  ADMIN_JWT_SECRET: crypto.randomBytes(32).toString('hex'),
  ADMIN_API_KEY: crypto.randomBytes(24).toString('hex'),
  NEXTAUTH_SECRET: crypto.randomBytes(32).toString('hex'),
  DB_PASSWORD: crypto.randomBytes(16).toString('hex'),
  REDIS_PASSWORD: crypto.randomBytes(16).toString('hex')
};

console.log('📋 Copy these to your .env.local file:\n');
console.log('='.repeat(60));

Object.entries(secrets).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});

console.log('='.repeat(60));

console.log('\n📝 Instructions:');
console.log('1. Open your .env.local file');
console.log('2. Replace the existing values with these new secrets');
console.log('3. Save the file');
console.log('4. Restart your development server if running');
console.log('\n⚠️  Important:');
console.log('- Never commit .env.local to version control');
console.log('- Regenerate these for production');
console.log('- Keep these secrets secure');