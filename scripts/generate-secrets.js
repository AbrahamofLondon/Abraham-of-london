#!/usr/bin/env node
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function generateBase64Secret(length = 48) {
  return crypto.randomBytes(length).toString('base64');
}

function generateEnvFile() {
  const secrets = {
    // JWT Secrets
    INNER_CIRCLE_JWT_SECRET: generateSecret(64),
    JWT_SECRET: generateSecret(64),
    ADMIN_JWT_SECRET: generateSecret(64),
    
    // API Keys
    ADMIN_API_KEY: generateSecret(32),
    
    // Database
    DATABASE_PASSWORD: generateBase64Secret(24),
    
    // Redis
    REDIS_PASSWORD: generateSecret(16),
  };

  // Read existing .env.example
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  let envContent = '';
  
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
  } else {
    // Create basic template if .env.example doesn't exist
    envContent = `# ============================================
# DATABASE CONFIGURATION
# ============================================
DATABASE_URL="postgresql://username:password@localhost:5432/inner_circle_db"
INNER_CIRCLE_DB_URL="postgresql://username:password@localhost:5432/inner_circle_db"

# ============================================
# JWT & SECURITY
# ============================================
INNER_CIRCLE_JWT_SECRET=""
JWT_SECRET=""
ADMIN_JWT_SECRET=""
ADMIN_JWT_ENABLED="true"

# ============================================
# ADMIN ACCESS
# ============================================
ADMIN_API_KEY=""

# ============================================
# INNER CIRCLE CONFIGURATION
# ============================================
INNER_CIRCLE_KEY_EXPIRY_DAYS="90"
INNER_CIRCLE_RATE_LIMIT_IP="5"
INNER_CIRCLE_RATE_LIMIT_EMAIL="3"
INNER_CIRCLE_MAX_UNLOCKS_DAILY="100"
INNER_CIRCLE_JWT_EXPIRY_HOURS="24"

# ============================================
# CACHE CONFIGURATION
# ============================================
REDIS_URL="redis://localhost:6379"
INNER_CIRCLE_ENABLE_CACHE="true"
INNER_CIRCLE_CACHE_TTL="300"

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT_GLOBAL_LIMIT="100"
RATE_LIMIT_API_LIMIT="30"
RATE_LIMIT_STRICT_MODE="true"

# ============================================
# SECURITY HEADERS
# ============================================
ENABLE_STRICT_CSP="true"
HSTS_MAX_AGE="31536000"

# ============================================
# DEBUG & DEVELOPMENT
# ============================================
NODE_ENV="development"
MIDDLEWARE_DEBUG="false"
LOG_SUSPICIOUS_REQUESTS="true"`;
  }

  // Replace or add secret values
  Object.entries(secrets).forEach(([key, value]) => {
    const placeholder = `${key}=`;
    const regex = new RegExp(`${placeholder}.*`, 'g');
    
    if (envContent.includes(placeholder)) {
      envContent = envContent.replace(regex, `${placeholder}"${value}"`);
    } else {
      envContent += `\n${placeholder}"${value}"`;
    }
  });

  // Create .env.local file (but don't commit it!)
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  fs.writeFileSync(envLocalPath, envContent);
  
  console.log('✅ Secrets generated in .env.local');
  console.log('⚠️  WARNING: Never commit .env.local to version control!');
  console.log('\nGenerated secrets:');
  Object.entries(secrets).forEach(([key, value]) => {
    console.log(`${key}: ${value.substring(0, 8)}...`);
  });
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateEnvFile();
}

export { generateSecret, generateBase64Secret };