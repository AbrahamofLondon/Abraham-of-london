// scripts/setup-env.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Abraham of London - Environment Setup\n');
console.log('This script will help you set up your development environment.\n');

const rootDir = path.join(__dirname, '..');
const envLocalPath = path.join(rootDir, '.env.local');
const envExamplePath = path.join(rootDir, '.env.example');

// Generate secure random secrets
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function askQuestion(question, defaultValue = '') {
  return new Promise((resolve) => {
    rl.question(`${question} ${defaultValue ? `[${defaultValue}] ` : ''}`, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function setupEnvironment() {
  // Check if .env.local already exists
  if (fs.existsSync(envLocalPath)) {
    const overwrite = await askQuestion('.env.local already exists. Overwrite? (y/N): ', 'n');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  // Check if .env.example exists
  if (!fs.existsSync(envExamplePath)) {
    console.log('❌ Error: .env.example not found. Creating basic template...');
    
    const exampleTemplate = `# ============================================
# DATABASE CONFIGURATION
# ============================================
DATABASE_URL="postgresql://localhost:5432/abraham_of_london"

# ============================================
# JWT & SECURITY
# ============================================
JWT_SECRET=change-me-in-production
NEXTAUTH_SECRET=change-me-in-production

# ============================================
# NEXT.JS CONFIGURATION
# ============================================
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"

# ============================================
# APPLICATION CONFIGURATION
# ============================================
NODE_ENV="development"
APP_NAME="Abraham of London"
LOG_LEVEL="info"`;
    
    fs.writeFileSync(envExamplePath, exampleTemplate);
    console.log('✅ Created .env.example template');
  }

  // Ask for user input
  console.log('\n📝 Please provide the following information:\n');

  const dbHost = await askQuestion('Database host:', 'localhost');
  const dbPort = await askQuestion('Database port:', '5432');
  const dbName = await askQuestion('Database name:', 'abraham_of_london');
  const dbUser = await askQuestion('Database user:', 'postgres');
  const dbPassword = await askQuestion('Database password:', 'postgres');
  
  const siteUrl = await askQuestion('Development site URL:', 'http://localhost:3000');
  const adminEmail = await askQuestion('Admin email:', 'admin@abrahamoflondon.org');
  
  const useSSL = await askQuestion('Use SSL for database? (y/N):', 'n');
  const sslMode = useSSL.toLowerCase() === 'y' ? 'require' : 'prefer';

  // Build the .env.local content
  const envLocalContent = `# ============================================
# DATABASE CONFIGURATION (Development)
# ============================================
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_NAME=${dbName}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_SSL=${useSSL.toLowerCase() === 'y' ? 'true' : 'false'}
DATABASE_URL="postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?sslmode=${sslMode}"

# ============================================
# AUTO-GENERATED SECRETS
# ============================================
# These are auto-generated for development
# Regenerate for production with: npm run generate-secrets
INNER_CIRCLE_JWT_SECRET="${generateSecret(32)}"
JWT_SECRET="${generateSecret(32)}"
ADMIN_JWT_SECRET="${generateSecret(32)}"
ADMIN_API_KEY="${generateSecret(24)}"
NEXTAUTH_SECRET="${generateSecret(32)}"

# ============================================
# ADMIN ACCESS
# ============================================
ADMIN_USER_EMAIL="${adminEmail}"
ADMIN_USER_PASSWORD="change-this-password-in-production"

# ============================================
# DEVELOPMENT OVERRIDES
# ============================================
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=${siteUrl}
NEXTAUTH_URL=${siteUrl}

# ============================================
# SERVICE CREDENTIALS (Optional - set as needed)
# ============================================
# SMTP_USER="your-email@gmail.com"
# SMTP_PASS="your-app-password"
# RESEND_API_KEY=""
# REDIS_PASSWORD=""
# NEXT_PUBLIC_GA_MEASUREMENT_ID=""

# ============================================
# DEVELOPMENT FLAGS
# ============================================
SKIP_AUTH_IN_DEV=true
ALLOW_INSECURE_IN_DEV=true
MIDDLEWARE_DEBUG=false
`;

  // Write .env.local
  fs.writeFileSync(envLocalPath, envLocalContent);
  console.log(`\n✅ Created ${envLocalPath}`);
  
  // Create a basic .env if it doesn't exist
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) {
    const envContent = `# ============================================
# APPLICATION CONFIGURATION
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
# DATABASE (Development defaults)
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
RATE_LIMIT_STRICT_MODE=true

# ============================================
# EMAIL (Configuration only - no credentials)
# ============================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
INNER_CIRCLE_NOTIFICATION_EMAIL="notifications@abrahamoflondon.org"
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Created ${envPath} (committed configuration)`);
  }

  console.log('\n🎉 Environment setup complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Review and edit .env.local if needed');
  console.log('   2. Start your database service');
  console.log('   3. Run: npm run db:migrate');
  console.log('   4. Run: npm run db:seed (if you have seed data)');
  console.log('   5. Start development: npm run dev');
  console.log('\n⚠️  Remember:');
  console.log('   - .env.local contains sensitive data and is NOT committed to git');
  console.log('   - .env contains non-sensitive configuration and IS committed');
  console.log('   - For production, regenerate all secrets with: npm run generate-secrets');
  
  rl.close();
}

// Create scripts directory if it doesn't exist
const scriptsDir = path.join(__dirname);
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

setupEnvironment().catch(err => {
  console.error('❌ Setup failed:', err);
  rl.close();
  process.exit(1);
});
