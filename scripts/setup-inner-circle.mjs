// scripts/setup-inner-circle.mjs (or rename to .cjs)
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up Inner Circle...');
console.log('============================\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('Please create .env.local from .env.local.example');
  process.exit(1);
}

// Read current .env.local
let envContent = fs.readFileSync(envPath, 'utf8');

// Check if INNER_CIRCLE_ADMIN_KEY is already set
if (envContent.includes('INNER_CIRCLE_ADMIN_KEY=')) {
  const match = envContent.match(/INNER_CIRCLE_ADMIN_KEY=(.+)/);
  if (match && match[1].trim() && !match[1].includes('your-generated')) {
    console.log('✅ INNER_CIRCLE_ADMIN_KEY is already set');
    console.log(`Current key: ${match[1].slice(0, 10)}...${match[1].slice(-10)}`);
  } else {
    // Generate new key
    const newKey = crypto.randomBytes(32).toString('hex');
    envContent = envContent.replace(
      /INNER_CIRCLE_ADMIN_KEY=.*/,
      `INNER_CIRCLE_ADMIN_KEY=${newKey}`
    );
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Generated and saved new INNER_CIRCLE_ADMIN_KEY');
    console.log(`New key: ${newKey.slice(0, 10)}...${newKey.slice(-10)}`);
  }
} else {
  // Add missing key
  const newKey = crypto.randomBytes(32).toString('hex');
  envContent += `\n# Inner Circle Admin Key\nINNER_CIRCLE_ADMIN_KEY=${newKey}\n`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Added INNER_CIRCLE_ADMIN_KEY to .env.local');
  console.log(`New key: ${newKey.slice(0, 10)}...${newKey.slice(-10)}`);
}

console.log('\n📋 Next steps:');
console.log('1. Restart your development server');
console.log('2. Visit http://localhost:3000/admin/inner-circle');
console.log('3. Paste the admin key when prompted');
console.log('\n🔧 For PostgreSQL setup:');
console.log('- Set INNER_CIRCLE_STORE=postgres');
console.log('- Set DATABASE_URL or INNER_CIRCLE_DB_URL');
console.log('- Run the SQL schema from lib/innerCircleMembership.ts');