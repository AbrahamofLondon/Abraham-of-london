/* scripts/environment/generate-development-env.ts */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔨 Generating development environment...');

const projectRoot = process.cwd();
const templatesDir = path.join(projectRoot, 'scripts', 'environment', 'templates');
const templatePath = path.join(templatesDir, 'development.env');
const outputPath = path.join(projectRoot, '.env.development');

if (!fs.existsSync(templatePath)) {
  console.error('❌ Development template not found. Run: pnpm env:setup');
  process.exit(1);
}

try {
  // Read template
  const template = fs.readFileSync(templatePath, 'utf-8');
  
  // Generate secure secrets for development
  const secrets = {
    NEXTAUTH_SECRET: generateSecret(32),
    JWT_SECRET: generateSecret(32),
    ENCRYPTION_KEY: generateSecret(32),
    RESEND_API_KEY: 're_dev_' + generateSecret(24),
  };
  
  // Replace placeholders
  let output = template;
  for (const [key, value] of Object.entries(secrets)) {
    output = output.replace(new RegExp(`\\\$\\{${key}\\}`, 'g'), value);
  }
  
  // Add Windows-specific settings
  if (process.platform === 'win32') {
    output += '\n# Windows-specific settings\n';
    output += 'IS_WINDOWS=true\n';
    output += 'POWERSHELL_PATH=powershell.exe\n';
  }
  
  // Write output
  fs.writeFileSync(outputPath, output);
  console.log(`✅ Created ${path.relative(projectRoot, outputPath)}`);
  
  // Also update .env.local if it exists
  const envLocalPath = path.join(projectRoot, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    console.log('📝 Updating .env.local with development values...');
    const envLocal = fs.readFileSync(envLocalPath, 'utf-8');
    
    // Update secrets in .env.local
    let updatedEnvLocal = envLocal;
    for (const [key, value] of Object.entries(secrets)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(updatedEnvLocal)) {
        updatedEnvLocal = updatedEnvLocal.replace(regex, `${key}=${value}`);
      } else {
        updatedEnvLocal += `\n${key}=${value}`;
      }
    }
    
    fs.writeFileSync(envLocalPath, updatedEnvLocal);
    console.log('✅ Updated .env.local');
  }
  
  console.log('\n🎉 Development environment generated!');
  console.log('\n📝 Secrets generated for development:');
  for (const [key, value] of Object.entries(secrets)) {
    console.log(`   ${key}=${value}`);
  }
  console.log('\n💡 Remember to use actual secrets in production!');
  
} catch (error) {
  console.error('❌ Error generating development environment:', error);
  process.exit(1);
}

function generateSecret(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}