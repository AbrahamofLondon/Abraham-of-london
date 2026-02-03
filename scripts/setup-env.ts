// scripts/setup-env.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

/**
 * SECURITY NOTE: This script is an environment generator. 
 * It contains NO production secrets. All values are generated locally per machine.
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const rootDir = path.join(__dirname, '..');
const envLocalPath = path.join(rootDir, '.env.local');

// Generate cryptographically secure random strings
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Generate a random "passphrase" style string for dev passwords
function generateDevPassword() {
  return `dev_${crypto.randomBytes(12).toString('base64url')}`;
}

function askQuestion(question, defaultValue = '') {
  return new Promise((resolve) => {
    rl.question(`${question} ${defaultValue ? `[${defaultValue}] ` : ''}`, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function setupEnvironment() {
  console.log('🔧 Abraham of London - Institutional Environment Setup\n');

  if (fs.existsSync(envLocalPath)) {
    const overwrite = await askQuestion('.env.local exists. Overwrite? (y/N): ', 'n');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup aborted.');
      rl.close();
      return;
    }
  }

  // Gather Input
  const dbUser = await askQuestion('Database user:', 'postgres');
  const dbName = await askQuestion('Database name:', 'abraham_of_london');
  
  // SECURE: Generate a unique local password instead of hardcoding "postgres"
  const dbPassword = await askQuestion('Database password (local):', generateDevPassword());
  const adminEmail = await askQuestion('Admin email:', 'admin@abrahamoflondon.org');
  const adminPassword = generateDevPassword(); // No default string, strictly generated

  const envLocalContent = `# ============================================
# DATABASE CONFIGURATION (Local Development)
# ============================================
DATABASE_URL="postgresql://${dbUser}:${dbPassword}@localhost:5432/${dbName}?sslmode=prefer"

# ============================================
# AUTO-GENERATED INSTITUTIONAL SECRETS
# ============================================
# Unique to this machine. Do not share.
ACCESS_COOKIE_SECRET="${generateSecret(32)}"
ACCESS_KEY_PEPPER="${generateSecret(16)}"
JWT_SECRET="${generateSecret(32)}"
INNER_CIRCLE_JWT_SECRET="${generateSecret(32)}"
ADMIN_JWT_SECRET="${generateSecret(32)}"

# ============================================
# INITIAL ADMIN CREDENTIALS
# ============================================
ADMIN_USER_EMAIL="${adminEmail}"
ADMIN_USER_PASSWORD="${adminPassword}"

# ============================================
# SERVICE STUBS
# ============================================
RESEND_API_KEY="re_dev_${generateSecret(12)}"
RECAPTCHA_SECRET="6Le_dev_${generateSecret(12)}"
`;

  fs.writeFileSync(envLocalPath, envLocalContent);
  
  console.log(`\n✅ Created ${envLocalPath}`);
  console.log(`\n🔐 LOCAL ADMIN PASSWORD GENERATED: ${adminPassword}`);
  console.log('Store this password in your local manager; it is not saved anywhere else but .env.local.');
  
  rl.close();
}

setupEnvironment().catch(console.error);