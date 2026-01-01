#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function setup() {
  console.log('🔧 Setting up environment files...\n');
  
  const envLocalPath = path.join(rootDir, '.env.local');
  
  if (await fileExists(envLocalPath)) {
    const overwrite = await question('.env.local exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }
  
  // Create .env.example if it doesn't exist
  const envExamplePath = path.join(rootDir, '.env.example');
  if (!await fileExists(envExamplePath)) {
    const envExample = `# ============================================
# DATABASE CONFIGURATION
# ============================================
DATABASE_URL="postgresql://localhost:5432/abraham_of_london"

# ============================================
# JWT & SECURITY (Generate with npm run secrets:generate)
# ============================================
INNER_CIRCLE_JWT_SECRET=""
JWT_SECRET=""
ADMIN_JWT_SECRET=""
ADMIN_API_KEY=""
NEXTAUTH_SECRET=""

# ============================================
# NEXT.JS CONFIGURATION
# ============================================
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"

# ============================================
# APPLICATION CONFIGURATION
# ============================================
NODE_ENV="development"
LOG_LEVEL="info"`;
    
    await fs.writeFile(envExamplePath, envExample, 'utf8');
    console.log('✅ Created .env.example');
  }
  
  // Create .env if it doesn't exist
  const envPath = path.join(rootDir, '.env');
  if (!await fileExists(envPath)) {
    const envContent = `# ============================================
# APPLICATION CONFIGURATION (Non-sensitive)
# ============================================
NODE_ENV=development
APP_NAME="Abraham of London"
LOG_LEVEL=info

# ============================================
# NEXT.JS CONFIGURATION
# ============================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# ============================================
# DATABASE (Placeholder - real URL in .env.local)
# ============================================
DATABASE_URL="postgresql://localhost:5432/abraham_of_london"

# ============================================
# INNER CIRCLE CONFIGURATION
# ============================================
INNER_CIRCLE_KEY_EXPIRY_DAYS=90
INNER_CIRCLE_RATE_LIMIT_IP=5
INNER_CIRCLE_RATE_LIMIT_EMAIL=3
INNER_CIRCLE_MAX_UNLOCKS_DAILY=100
INNER_CIRCLE_ENABLE_CACHE=true

# ============================================
# SECURITY & RATE LIMITING
# ============================================
ENABLE_AUDIT_LOGGING=true
RATE_LIMIT_GLOBAL_LIMIT=100
RATE_LIMIT_STRICT_MODE=true`;
    
    await fs.writeFile(envPath, envContent, 'utf8');
    console.log('✅ Created .env (non-sensitive config)');
  }
  
  // Create .env.local with generated secrets
  const envLocal = `# ============================================
# DATABASE CONFIGURATION (Sensitive - DO NOT COMMIT)
# ============================================
DATABASE_URL="postgresql://postgres:password@localhost:5432/abraham_of_london"

# ============================================
# AUTO-GENERATED SECRETS
# ============================================
INNER_CIRCLE_JWT_SECRET="${generateSecret(32)}"
JWT_SECRET="${generateSecret(32)}"
ADMIN_JWT_SECRET="${generateSecret(32)}"
ADMIN_API_KEY="${generateSecret(24)}"
NEXTAUTH_SECRET="${generateSecret(32)}"

# ============================================
# ADMIN ACCESS
# ============================================
ADMIN_USER_EMAIL="admin@abrahamoflondon.org"
ADMIN_USER_PASSWORD="change-this-password"

# ============================================
# DEVELOPMENT OVERRIDES
# ============================================
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
SKIP_AUTH_IN_DEV=true
ALLOW_INSECURE_IN_DEV=true

# ============================================
# SERVICE CREDENTIALS (Optional)
# ============================================
# SMTP_USER="your-email@gmail.com"
# SMTP_PASS="your-app-password"
# RESEND_API_KEY=""
# REDIS_PASSWORD=""`;
  
  await fs.writeFile(envLocalPath, envLocal, 'utf8');
  console.log('✅ Created .env.local with generated secrets');
  console.log('\n⚠️  IMPORTANT: .env.local contains sensitive data and is NOT committed to git');
  console.log('   Update the DATABASE_URL with your actual credentials');
  
  console.log('\n📋 Next steps:');
  console.log('1. Edit .env.local with your actual database credentials');
  console.log('2. Run: npm run db:setup');
  console.log('3. Run: npm run dev');
  
  rl.close();
}

setup().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});