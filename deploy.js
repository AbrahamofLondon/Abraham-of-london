const { execSync } = require('child_process');
const fs = require('fs-extra');

console.log('🚀 Starting premium deployment...');

// 1. Clean previous builds
execSync('npm run clean', { stdio: 'inherit' });

// 2. Build with analytics
console.log('🔨 Building project...');
execSync('npm run build', { stdio: 'inherit' });

// 3. Optimize static assets
console.log('✨ Optimizing assets...');
fs.copySync('public', 'out/public');
fs.removeSync('out/_next/static/chunks/pages');

console.log('✅ Deployment package ready in /out');
console.log('💎 Upload contents to your premium hosting provider');