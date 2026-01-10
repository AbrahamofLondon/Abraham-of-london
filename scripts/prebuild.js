// scripts/pre-build.js
const fs = require('fs');
const path = require('path');

console.log('🔧 [Pre-build] Running pre-build checks...');

// Simple pre-build checks
const downloadDirs = [
  path.join(process.cwd(), 'public', 'downloads'),
  path.join(process.cwd(), 'public', 'assets', 'downloads')
];

console.log('📁 [Pre-build] Checking for download directories...');
for (const dir of downloadDirs) {
  if (fs.existsSync(dir)) {
    try {
      const files = fs.readdirSync(dir);
      console.log(`   Found ${files.length} files in ${path.basename(dir)}`);
    } catch (err) {
      console.warn(`   Could not read ${dir}: ${err.message}`);
    }
  } else {
    console.log(`   Directory not found: ${path.basename(dir)}`);
  }
}

// Ensure .contentlayer directory exists
const contentlayerDir = path.join(process.cwd(), '.contentlayer');
if (!fs.existsSync(contentlayerDir)) {
  fs.mkdirSync(contentlayerDir, { recursive: true });
  console.log('📁 Created .contentlayer directory');
}

console.log('✅ [Pre-build] Complete');