// build-simple.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Starting simple build process...');

// Clean previous builds
try {
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
    console.log('✅ Cleared .next directory');
  }
  if (fs.existsSync('.contentlayer')) {
    fs.rmSync('.contentlayer', { recursive: true, force: true });
    console.log('✅ Cleared .contentlayer directory');
  }
} catch (error) {
  console.log('⚠️ Cleanup error:', error.message);
}

// Try to build with Next.js directly (bypass Contentlayer)
console.log('🚀 Building Next.js app...');
try {
  execSync('next build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}