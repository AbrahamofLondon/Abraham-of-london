/* scripts/environment/setup-env.ts - Environment setup script */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 Setting up environment variables...');

const projectRoot = process.cwd();
const envDir = path.join(projectRoot, 'scripts', 'environment');

// Ensure scripts/environment directory exists
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

// Environment template
const envTemplate = `# ============================================
# Abraham of London - Environment Variables
# ============================================
# This file contains sensitive information.
# NEVER commit this file to version control.
# ============================================

# ========================
# Application Configuration
# ========================
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_NAME="Abraham of London"
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# ========================
# Database Configuration
# ========================
DATABASE_URL="file:./prisma/dev.db"

# ========================
# Authentication
# ========================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-nextauth-key-change-this-in-production
JWT_SECRET=your-jwt-secret-key-change-this-in-production

# ========================
# Email Configuration
# ========================
EMAIL_FROM=noreply@abrahamoflondon.com
EMAIL_SERVER=smtp.resend.com
EMAIL_PORT=587
EMAIL_USER=resend
RESEND_API_KEY=re_1234567890abcdefghijklmnopqrstuvwxyz

# ========================
# PDF Configuration
# ========================
PDF_OUTPUT_DIR=./public/pdfs
PDF_TEMP_DIR=./.temp/pdfs
PDF_FONTS_DIR=./public/fonts

# ========================
# Security
# ========================
ENCRYPTION_KEY=your-32-character-encryption-key-here
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# ========================
# Analytics & Monitoring
# ========================
ENABLE_ANALYTICS=false
ENABLE_PERFORMANCE_MONITORING=false

# ========================
# Feature Flags
# ========================
ENABLE_PDF_GENERATION=true
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_DATABASE_BACKUPS=true

# ========================
# Development Only
# ========================
DEBUG_CONTENTLAYER=false
DEBUG_PDF_GENERATION=false
IS_WINDOWS=${process.platform === 'win32' ? 'true' : 'false'}
`;

// Production environment template
const productionEnvTemplate = `# ============================================
# Abraham of London - PRODUCTION Environment
# ============================================
# AUTO-GENERATED - DO NOT EDIT MANUALLY
# ============================================

NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_NAME="Abraham of London"
NEXT_PUBLIC_APP_URL=https://abrahamoflondon.com
NEXT_PUBLIC_API_URL=https://abrahamoflondon.com/api

# Database - Update for production
DATABASE_URL="file:./prisma/production.db"

# Authentication - MUST be set in production
NEXTAUTH_URL=https://abrahamoflondon.com
NEXTAUTH_SECRET=\${NEXTAUTH_SECRET}
JWT_SECRET=\${JWT_SECRET}

# Email - MUST be set in production
EMAIL_FROM=noreply@abrahamoflondon.com
EMAIL_SERVER=smtp.resend.com
EMAIL_PORT=587
EMAIL_USER=resend
RESEND_API_KEY=\${RESEND_API_KEY}

# PDF Configuration
PDF_OUTPUT_DIR=./public/pdfs
PDF_TEMP_DIR=./.temp/pdfs
PDF_FONTS_DIR=./public/fonts

# Security - MUST be set in production
ENCRYPTION_KEY=\${ENCRYPTION_KEY}
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=900000

# Analytics
ENABLE_ANALYTICS=true
ENABLE_PERFORMANCE_MONITORING=true

# Feature Flags
ENABLE_PDF_GENERATION=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_DATABASE_BACKUPS=true
`;

// Staging environment template
const stagingEnvTemplate = `# ============================================
# Abraham of London - STAGING Environment
# ============================================
# AUTO-GENERATED - DO NOT EDIT MANUALLY
# ============================================

NODE_ENV=production
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_APP_NAME="Abraham of London (Staging)"
NEXT_PUBLIC_APP_URL=https://staging.abrahamoflondon.com
NEXT_PUBLIC_API_URL=https://staging.abrahamoflondon.com/api

DATABASE_URL="file:./prisma/staging.db"

NEXTAUTH_URL=https://staging.abrahamoflondon.com
NEXTAUTH_SECRET=\${NEXTAUTH_SECRET}
JWT_SECRET=\${JWT_SECRET}

EMAIL_FROM=noreply@staging.abrahamoflondon.com
EMAIL_SERVER=smtp.resend.com
EMAIL_PORT=587
EMAIL_USER=resend
RESEND_API_KEY=\${RESEND_API_KEY}

PDF_OUTPUT_DIR=./public/pdfs
PDF_TEMP_DIR=./.temp/pdfs
PDF_FONTS_DIR=./public/fonts

ENCRYPTION_KEY=\${ENCRYPTION_KEY}
RATE_LIMIT_MAX_REQUESTS=500
RATE_LIMIT_WINDOW_MS=900000

ENABLE_ANALYTICS=true
ENABLE_PERFORMANCE_MONITORING=true

ENABLE_PDF_GENERATION=true
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_DATABASE_BACKUPS=true
`;

// Development environment template
const developmentEnvTemplate = `# ============================================
# Abraham of London - DEVELOPMENT Environment
# ============================================
# AUTO-GENERATED - DO NOT EDIT MANUALLY
# ============================================

NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_NAME="Abraham of London (Dev)"
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

DATABASE_URL="file:./prisma/dev.db"

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-nextauth-secret-key-change-in-production
JWT_SECRET=dev-jwt-secret-key-change-in-production

EMAIL_FROM=dev@abrahamoflondon.com
EMAIL_SERVER=smtp.resend.com
EMAIL_PORT=587
EMAIL_USER=resend
RESEND_API_KEY=re_dev_key_placeholder

PDF_OUTPUT_DIR=./public/pdfs
PDF_TEMP_DIR=./.temp/pdfs
PDF_FONTS_DIR=./public/fonts

ENCRYPTION_KEY=dev-encryption-key-32-chars-long-here
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

ENABLE_ANALYTICS=false
ENABLE_PERFORMANCE_MONITORING=false

ENABLE_PDF_GENERATION=true
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_DATABASE_BACKUPS=true

DEBUG_CONTENTLAYER=true
DEBUG_PDF_GENERATION=true
IS_WINDOWS=${process.platform === 'win32' ? 'true' : 'false'}
`;

// Validate environment template
const validateEnvTemplate = `# ============================================
# Abraham of London - Environment Validation
# ============================================
# This file validates required environment variables
# ============================================

REQUIRED_VARIABLES=(
  "NODE_ENV"
  "NEXT_PUBLIC_APP_ENV"
  "NEXT_PUBLIC_APP_NAME"
  "NEXT_PUBLIC_APP_URL"
  "DATABASE_URL"
  "NEXTAUTH_URL"
  "NEXTAUTH_SECRET"
  "JWT_SECRET"
)

OPTIONAL_VARIABLES=(
  "EMAIL_FROM"
  "RESEND_API_KEY"
  "ENCRYPTION_KEY"
  "ENABLE_ANALYTICS"
  "ENABLE_PDF_GENERATION"
)

PRODUCTION_REQUIRED=(
  "NEXTAUTH_SECRET"
  "JWT_SECRET"
  "ENCRYPTION_KEY"
)
`;

function createFile(filePath: string, content: string, overwrite = false) {
  if (!fs.existsSync(filePath) || overwrite) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Created ${path.relative(projectRoot, filePath)}`);
    return true;
  } else {
    console.log(`⚠️  Skipped ${path.relative(projectRoot, filePath)} (already exists)`);
    return false;
  }
}

try {
  // Create .env files
  console.log('\n📁 Creating environment files...');
  
  const envLocalPath = path.join(projectRoot, '.env.local');
  const envPath = path.join(projectRoot, '.env');
  
  // Create .env.local (development)
  if (!fs.existsSync(envLocalPath)) {
    createFile(envLocalPath, envTemplate);
  } else {
    console.log('✅ .env.local already exists');
  }
  
  // Create .env (for default values)
  createFile(envPath, envTemplate, true);
  
  // Create environment-specific templates
  console.log('\n📁 Creating environment templates...');
  
  const envTemplatesDir = path.join(envDir, 'templates');
  if (!fs.existsSync(envTemplatesDir)) {
    fs.mkdirSync(envTemplatesDir, { recursive: true });
  }
  
  createFile(path.join(envTemplatesDir, 'production.env'), productionEnvTemplate, true);
  createFile(path.join(envTemplatesDir, 'staging.env'), stagingEnvTemplate, true);
  createFile(path.join(envTemplatesDir, 'development.env'), developmentEnvTemplate, true);
  createFile(path.join(envTemplatesDir, 'validate.env'), validateEnvTemplate, true);
  
  // Create README
  const readmeContent = `# Environment Setup

## Files
- \`.env.local\` - Local development environment (gitignored)
- \`.env\` - Default environment variables
- \`templates/\` - Environment templates for different deployments

## Setup
1. Run \`pnpm env:setup\` to create initial files
2. Update \`.env.local\` with your actual values
3. For production, set actual secrets via your hosting platform

## Required Variables for Production
- NEXTAUTH_SECRET
- JWT_SECRET
- ENCRYPTION_KEY
- RESEND_API_KEY (for emails)
- DATABASE_URL (production database)

## Security Notes
- NEVER commit \`.env.local\` to version control
- Use environment variables for secrets in production
- Rotate secrets periodically
`;
  
  createFile(path.join(envDir, 'README.md'), readmeContent, true);
  
  // Create .gitignore entries if not present
  const gitignorePath = path.join(projectRoot, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    const requiredEntries = [
      '# Environment files',
      '.env.local',
      '.env.*.local',
      '.env.production',
      '.env.development',
      '!.env.example',
      '',
      '# Sensitive data',
      '*.db',
      '*.db-journal',
      '*.pem',
      '*.key',
      '',
      '# Temporary files',
      '.temp/',
      '.cache/',
    ];
    
    const missingEntries = requiredEntries.filter(entry => 
      !gitignoreContent.includes(entry.replace('# ', '').replace('!', '').trim())
    );
    
    if (missingEntries.length > 0) {
      fs.appendFileSync(gitignorePath, '\n' + missingEntries.join('\n'));
      console.log('✅ Added missing entries to .gitignore');
    }
  }
  
  // Create directories
  console.log('\n📁 Creating required directories...');
  const directories = [
    '.temp',
    '.temp/pdfs',
    'prisma',
    'public/pdfs',
    'public/fonts',
    'scripts/environment/templates'
  ];
  
  directories.forEach(dir => {
    const dirPath = path.join(projectRoot, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created ${dir}/`);
    }
  });
  
  console.log('\n🎉 Environment setup complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Edit .env.local with your actual values');
  console.log('2. Run: pnpm db:setup');
  console.log('3. Run: pnpm dev:init');
  
} catch (error) {
  console.error('❌ Error setting up environment:', error);
  process.exit(1);
}