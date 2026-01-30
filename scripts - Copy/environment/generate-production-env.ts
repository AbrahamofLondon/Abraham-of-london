// scripts/environment/generate-production-env.ts
import { writeFileSync, existsSync } from 'fs';
import path from 'path';

console.log('🚀 Generating production environment configuration...\n');

// Production environment variables template
const productionEnvContent = `# ========================================
# Abraham of London - Production Environment
# Generated: ${new Date().toISOString()}
# ========================================

# Core Settings
NODE_ENV=production

# Database (SQLite for production)
DATABASE_URL="file:./prod.db"
SHADOW_DATABASE_URL="file:./shadow-prod.db"

# Application
NEXT_PUBLIC_SITE_URL="https://your-production-domain.com"
NEXT_PUBLIC_APP_NAME="Abraham of London"
NEXT_PUBLIC_APP_DESCRIPTION="Premium luxury brand"

# Optional: Analytics
NEXT_PUBLIC_GA_TRACKING_ID=""
NEXT_PUBLIC_GTM_ID=""

# Optional: CMS/Content
CONTENT_API_URL=""
CONTENT_API_KEY=""

# Optional: E-commerce
STRIPE_PUBLIC_KEY=""
STRIPE_SECRET_KEY=""

# Security
SESSION_SECRET="${generateRandomString(64)}"
JWT_SECRET="${generateRandomString(64)}"

# Performance
DATABASE_CONNECTION_LIMIT="10"
DATABASE_POOL_TIMEOUT="10000"

# Optional: Third-party services
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM="noreply@yourdomain.com"

# Logging
LOG_LEVEL="info"
LOG_TO_FILE="true"

# Feature flags
ENABLE_MAINTENANCE_MODE="false"
ENABLE_BETA_FEATURES="false"
`;

// Helper function to generate random strings for secrets
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Write to .env.production file
const envFilePath = path.join(process.cwd(), '.env.production');
writeFileSync(envFilePath, productionEnvContent);

console.log(`✅ Generated production environment file at: ${envFilePath}`);
console.log('\n📋 Please review and update the following important variables:');
console.log('   1. NEXT_PUBLIC_SITE_URL - Your production domain');
console.log('   2. Database credentials (if using PostgreSQL/MySQL)');
console.log('   3. Stripe keys (if using e-commerce)');
console.log('   4. SMTP settings (if sending emails)');
console.log('   5. Analytics tracking IDs');
console.log('\n⚠️  IMPORTANT: Update SESSION_SECRET and JWT_SECRET with your own secure values!');
console.log('   The generated values are placeholders for security.');

// Check if we should also copy to .env
const shouldCopyToEnv = process.argv.includes('--copy-to-env');
if (shouldCopyToEnv && !existsSync('.env')) {
  writeFileSync('.env', productionEnvContent);
  console.log('\n📄 Also created .env file with production defaults');
}

process.exit(0);