// fix-contentlayer-windows.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing Contentlayer on Windows...');

// Clear cache
const cachePath = path.join(process.cwd(), '.contentlayer');
if (fs.existsSync(cachePath)) {
  console.log('🗑️ Clearing Contentlayer cache...');
  fs.rmSync(cachePath, { recursive: true, force: true });
}

// Clear node_modules cache
const nodeModulesCache = path.join(process.cwd(), 'node_modules/.cache');
if (fs.existsSync(nodeModulesCache)) {
  console.log('🗑️ Clearing node_modules cache...');
  fs.rmSync(nodeModulesCache, { recursive: true, force: true });
}

// Check package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Ensure contentlayer2 is in dependencies, not devDependencies
if (packageJson.devDependencies?.['contentlayer2']) {
  console.log('📦 Moving contentlayer2 from devDependencies to dependencies...');
  packageJson.dependencies = packageJson.dependencies || {};
  packageJson.dependencies['contentlayer2'] = packageJson.devDependencies['contentlayer2'];
  delete packageJson.devDependencies['contentlayer2'];
  
  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

console.log('✅ Cache cleared and package.json updated');
