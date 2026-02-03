// scripts/setup-env.js
const fs = require('node:fs');
const path = require('node:fs');
const crypto = require('node:crypto');
const readline = require('node:readline');

/**
 * INSTITUTIONAL SETUP: Environment Generator
 * Generates local machine-specific secrets. No production data is stored here.
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const rootDir = process.cwd();
const envLocalPath = path.join(rootDir, '.env.local');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generateDevPassword() {
  // Generates a base64url "passphrase" style string
  return `dev_${crypto.randomBytes(16).toString('base64url').replace(/[^a-zA-Z0-9]/g, '')}`;
}

function ask(question, defaultValue = '') {
  return new Promise((resolve) => {
    rl.question(`${question} ${defaultValue ? `[${defaultValue}] ` : ''}`, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function run() {
  console.log('🔧 Abraham of London - Secure Setup\n');

  if (fs.existsSync(envLocalPath)) {
    const overwrite = await ask('.env.local exists. Overwrite? (y/N): ', 'n');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup aborted.');
      rl.close();
      return;
    }
  }

  const dbUser = await ask('Local DB User:', 'postgres');
  const dbName = await ask('Local DB Name:', 'abraham_of_london');
  const dbPass = generateDevPassword();
  const adminPass = generateDevPassword();

  const content = `# ============================================
# DATABASE (Local Development)
# ============================================
DATABASE_URL="postgresql://${dbUser}:${dbPass}@localhost:5432/${dbName}?sslmode=prefer"

# ============================================
# SECURE GENERATED SECRETS
# ============================================
ACCESS_COOKIE_SECRET="${generateSecret(32)}"
ACCESS_KEY_PEPPER="${generateSecret(16)}"
JWT_SECRET="${generateSecret(32)}"
INNER_CIRCLE_JWT_SECRET="${generateSecret(32)}"
ADMIN_JWT_SECRET="${generateSecret(32)}"

# ============================================
# LOCAL ADMIN INITIALIZATION
# ============================================
ADMIN_USER_EMAIL="admin@abrahamoflondon.org"
ADMIN_USER_PASSWORD="${adminPass}"

# ============================================
# SERVICE STUBS
# ============================================
RESEND_API_KEY="re_dev_${generateSecret(12)}"
RECAPTCHA_SECRET="6Le_dev_${generateSecret(12)}"
`;

  fs.writeFileSync(envLocalPath, content);
  console.log(`\n✅ Generated .env.local with secure entropy.`);
  console.log(`🔐 LOCAL ADMIN PASSWORD: ${adminPass}`);
  rl.close();
}

run().catch(console.error);