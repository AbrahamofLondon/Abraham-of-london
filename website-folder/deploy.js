// Fixed deployment script for Abraham of London website
const fs = require('fs');
const { execSync } = require('child_process');

async function deploy() {
  console.log('🚀 Starting Abraham of London website deployment...');
  
  try {
    // Clean previous builds
    console.log('🧹 Cleaning previous builds...');
    if (fs.existsSync('.next')) {
      execSync('rm -rf .next');
    }
    if (fs.existsSync('out')) {
      execSync('rm -rf out');
    }
    
    // Install dependencies (if needed)
    if (!fs.existsSync('node_modules')) {
      console.log('📦 Installing dependencies...');
      execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
    }
    
    // Build the project
    console.log('🏗️  Building project...');
    execSync('npm run build', { stdio: 'inherit' });
    
    console.log('✅ Build completed successfully!');
    console.log('📁 Static files generated in /out directory');
    console.log('🌟 Abraham of London website is ready for deployment!');
    
    // Show deployment instructions
    console.log('\n📋 DEPLOYMENT OPTIONS:');
    console.log('1. Upload /out folder to any static hosting service');
    console.log('2. Use Netlify drag-and-drop with /out folder');
    console.log('3. Connect to Git repository for automatic deployment');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  deploy();
}

module.exports = deploy;