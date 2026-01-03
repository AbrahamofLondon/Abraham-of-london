// scripts/netlify-build.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Netlify Build...');
console.log('Node:', process.version);
console.log('CWD:', process.cwd());

// Check critical packages
const packages = ['tailwindcss', 'postcss', 'autoprefixer', '@tailwindcss/typography', 'next', 'react', 'react-dom'];
console.log('\n📦 Checking packages...');
packages.forEach(pkg => {
  try {
    require.resolve(pkg);
    console.log(`✅ ${pkg} found`);
  } catch (e) {
    console.log(`❌ ${pkg} NOT found: ${e.message}`);
  }
});

// Check config files
console.log('\n📁 Checking config files...');
const configs = ['tailwind.config.ts', 'postcss.config.ts', 'next.config.ts'];
configs.forEach(config => {
  if (fs.existsSync(path.join(process.cwd(), config))) {
    console.log(`✅ ${config} exists`);
  } else {
    console.log(`❌ ${config} missing`);
  }
});

// Set environment
process.env.CI = 'false';
process.env.NEXT_DISABLE_ESLINT = '1';
process.env.NEXT_DISABLE_TYPECHECK = '1';
process.env.NODE_ENV = 'production';

console.log('\n⚙️ Environment:');
console.log('CI:', process.env.CI);
console.log('NODE_ENV:', process.env.NODE_ENV);

try {
  console.log('\n📚 Building Contentlayer...');
  execSync('contentlayer2 build', { stdio: 'inherit' });
  
  console.log('\n🏗️ Building Next.js...');
  execSync('next build', { stdio: 'inherit' });
  
  console.log('\n✅ Build completed successfully!');
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
