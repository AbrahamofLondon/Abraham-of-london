// scripts/environment/check-env.ts - FLEXIBLE VERSION
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import fs from 'fs';
import path from 'path';

class EnvironmentValidator {
  // ==================== CRITICAL VARIABLES (Build will fail without these) ====================
  private criticalVars = {
    // Database - REQUIRED for Prisma
    DATABASE_URL: 'SQLite database connection',
    
    // Security - REQUIRED for authentication
    INNER_CIRCLE_JWT_SECRET: 'JWT signing secret',
    ADMIN_API_KEY: 'Admin API access key',
    
    // Application - REQUIRED for Next.js
    NODE_ENV: 'Environment (development/production)',
  };
  
  // ==================== FEATURE-SPECIFIC VARIABLES (Optional for build) ====================
  private featureVars = {
    // PDF Generation Feature
    PDF_GENERATION_API_KEY: 'PDF generation security',
    
    // Email Feature
    EMAIL_SERVER_HOST: 'SMTP server host',
    EMAIL_SERVER_PORT: 'SMTP server port',
    EMAIL_SERVER_USER: 'SMTP username',
    EMAIL_SERVER_PASSWORD: 'SMTP password',
    EMAIL_FROM: 'Default sender email',
    
    // Application URL (Nice to have)
    NEXT_PUBLIC_APP_URL: 'Application URL',
  };
  
  // ==================== OPTIONAL VARIABLES ====================
  private optionalVars = {
    // Analytics
    GOOGLE_ANALYTICS_ID: 'Google Analytics tracking ID',
    
    // Monitoring
    SENTRY_DSN: 'Sentry error tracking',
    
    // CDN
    CDN_URL: 'Content Delivery Network URL',
    
    // Feature Flags
    ENABLE_PREVIEW_MODE: 'Enable draft/preview mode',
    ENABLE_MAINTENANCE_MODE: 'Enable maintenance mode',
  };

  async validate() {
    console.log('🔍 Abraham of London - Environment Audit');
    console.log('='.repeat(50));
    
    // Load environment files in order
    this.loadEnvFiles();
    
    // Check critical variables
    const criticalMissing: string[] = [];
    const criticalPresent: string[] = [];
    
    for (const [key, description] of Object.entries(this.criticalVars)) {
      if (process.env[key]) {
        const maskedValue = this.maskSensitiveValue(key, process.env[key]!);
        criticalPresent.push(`${key}: ✓ ${maskedValue} (${description})`);
      } else {
        criticalMissing.push(`${key}: ✗ (${description})`);
      }
    }
    
    // Check feature variables
    const featureMissing: string[] = [];
    const featurePresent: string[] = [];
    
    for (const [key, description] of Object.entries(this.featureVars)) {
      if (process.env[key]) {
        const maskedValue = this.maskSensitiveValue(key, process.env[key]!);
        featurePresent.push(`${key}: ✓ ${maskedValue} (${description})`);
      } else {
        featureMissing.push(`${key}: ⚠️  (${description})`);
      }
    }
    
    // ==================== REPORT ====================
    
    // 1. Critical Variables
    if (criticalPresent.length > 0) {
      console.log('\n✅ CRITICAL VARIABLES (REQUIRED):');
      criticalPresent.forEach(item => console.log(`  ${item}`));
    }
    
    if (criticalMissing.length > 0) {
      console.log('\n❌ CRITICAL VARIABLES (MISSING - BUILD WILL FAIL):');
      criticalMissing.forEach(item => console.log(`  ${item}`));
    }
    
    // 2. Feature Variables
    if (featurePresent.length > 0) {
      console.log('\n⚙️  FEATURE VARIABLES (CONFIGURED):');
      featurePresent.forEach(item => console.log(`  ${item}`));
    }
    
    if (featureMissing.length > 0) {
      console.log('\n⚠️  FEATURE VARIABLES (MISSING - FEATURES DISABLED):');
      featureMissing.forEach(item => console.log(`  ${item}`));
      console.log('\n💡 These features will be disabled:');
      featureMissing.forEach(item => {
        const [key] = item.split(':');
        if (key.includes('EMAIL')) console.log(`   • Email functionality`);
        if (key.includes('PDF')) console.log(`   • PDF generation API`);
        if (key === 'NEXT_PUBLIC_APP_URL') console.log(`   • Absolute URLs in emails`);
      });
    }
    
    // 3. Optional Variables
    const optionalPresent = Object.entries(this.optionalVars)
      .filter(([key]) => process.env[key])
      .map(([key, desc]) => {
        const maskedValue = this.maskSensitiveValue(key, process.env[key]!);
        return `${key}: ⚙️  ${maskedValue} (${desc})`;
      });
    
    if (optionalPresent.length > 0) {
      console.log('\n🎯 OPTIONAL VARIABLES FOUND:');
      optionalPresent.forEach(item => console.log(`  ${item}`));
    }
    
    // ==================== SUMMARY ====================
    console.log('\n📊 ENVIRONMENT SUMMARY:');
    console.log(`  Mode: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`  Node.js: ${process.version}`);
    console.log(`  Platform: ${process.platform}`);
    console.log(`  Working directory: ${process.cwd()}`);
    
    // Check build capability
    const canBuild = criticalMissing.length === 0;
    
    console.log('\n' + '='.repeat(50));
    
    if (canBuild) {
      console.log('✅ BUILD READY: All critical variables are configured!');
      console.log('\n🚀 You can now run:');
      console.log('   pnpm run build  - Build for production');
      console.log('   pnpm run dev    - Start development server');
      
      if (featureMissing.length > 0) {
        console.log('\n📝 Note: Some features are disabled due to missing configuration.');
        console.log('   To enable all features, add the missing variables to .env.local');
      }
      
      return true;
    } else {
      console.log('❌ BUILD BLOCKED: Missing critical variables');
      console.log('\n💡 Add these to your .env.local file:');
      
      criticalMissing.forEach(item => {
        const [key] = item.split(':');
        console.log(`   ${key}=your_value_here`);
      });
      
      console.log('\n📝 Example .env.local:');
      console.log(`
DATABASE_URL="file:./prisma/dev.db"
INNER_CIRCLE_JWT_SECRET="your-32-character-jwt-secret-here"
ADMIN_API_KEY="your-admin-api-key"
NODE_ENV="development"`);
      
      return false;
    }
  }
  
  private loadEnvFiles() {
    const envFiles = [
      '.env.local',
      '.env.development', 
      '.env.production',
      '.env'
    ];
    
    for (const file of envFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        const envConfig = dotenv.config({ path: filePath });
        dotenvExpand.expand(envConfig);
        console.log(`📁 Loaded: ${file}`);
      }
    }
  }
  
  private maskSensitiveValue(key: string, value: string): string {
    const sensitiveKeys = ['SECRET', 'KEY', 'PASSWORD', 'TOKEN', 'JWT'];
    const isSensitive = sensitiveKeys.some(sensitive => 
      key.toUpperCase().includes(sensitive)
    );
    
    if (isSensitive && value.length > 8) {
      return `[${value.substring(0, 4)}...${value.substring(value.length - 4)}]`;
    }
    
    // For non-sensitive short values, show full value
    if (value.length <= 30 && !isSensitive) {
      return `[${value}]`;
    }
    
    // For long non-sensitive values, truncate
    return `[${value.substring(0, 20)}...]`;
  }
}

// Run validation
const validator = new EnvironmentValidator();

validator.validate().then(success => {
  // Don't exit with error code for missing feature variables
  // Only exit with error if critical variables are missing
  const hasCriticalVars = 
    process.env.DATABASE_URL && 
    process.env.INNER_CIRCLE_JWT_SECRET && 
    process.env.ADMIN_API_KEY && 
    process.env.NODE_ENV;
  
  process.exit(hasCriticalVars ? 0 : 1);
  
}).catch(error => {
  console.error('💥 Environment validation error:', error);
  process.exit(1);
});