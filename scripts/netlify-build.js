// scripts/netlify-build.js - Hardened Version
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Institutional Build...');

// Ensure we are in a clean state
try {
  if (fs.existsSync('.next')) {
    console.log('🧹 Cleaning old build artifacts...');
    fs.rmSync('.next', { recursive: true, force: true });
  }
} catch (e) {
  console.log('⚠️ Clean failed, proceeding anyway.');
}

process.env.NODE_ENV = 'production';
process.env.NEXT_DISABLE_ESLINT = '1';
process.env.NEXT_DISABLE_TYPECHECK = '1';

try {
  console.log('\n📚 Step 1: Contentlayer Generation...');
  execSync('npx contentlayer2 build', { stdio: 'inherit' });
  
  console.log('\n🏗️ Step 2: Next.js Standalone Build...');
  execSync('npx next build', { stdio: 'inherit' });
  
  console.log('\n✅ Build Stage Complete.');
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}