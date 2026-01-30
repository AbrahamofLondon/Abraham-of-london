#!/usr/bin/env node

/**
 * Fix mdast-util-to-markdown Package Exports for Windows
 * 
 * This script patches the package.json exports field to resolve:
 * ERR_PACKAGE_PATH_NOT_EXPORTED for container-phrasing.js
 * 
 * Safe to run multiple times - creates backups automatically
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = process.platform === 'win32';
const isSilent = process.argv.includes('--silent');

function log(message, force = false) {
  if (!isSilent || force) {
    console.log(message);
  }
}

function logError(message) {
  console.error(message);
}

log('🔧 mdast-util-to-markdown Package Exports Fix\n');

if (!isWindows && !process.argv.includes('--force')) {
  log('ℹ️  Not Windows - skipping (use --force to run anyway)');
  process.exit(0);
}

const projectRoot = path.resolve(__dirname, '..');

// Possible package locations
const packageLocations = [
  path.join(projectRoot, 'node_modules', 'mdast-util-mdx-jsx', 'node_modules', 'mdast-util-to-markdown'),
  path.join(projectRoot, 'node_modules', 'mdast-util-to-markdown'),
];

log('📍 Project root:', projectRoot);
log('🔍 Searching for mdast-util-to-markdown...\n');

let foundPackage = null;

for (const location of packageLocations) {
  if (fs.existsSync(location)) {
    log(`✅ Found at: ${location}`);
    foundPackage = location;
    break;
  } else {
    log(`   ❌ Not found: ${location}`);
  }
}

if (!foundPackage) {
  logError('\n❌ Could not find mdast-util-to-markdown package');
  logError('   Please run: npm install (or pnpm install)');
  process.exit(1);
}

const packageJsonPath = path.join(foundPackage, 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  logError(`\n❌ package.json not found at: ${packageJsonPath}`);
  process.exit(1);
}

try {
  log('\n📝 Reading package.json...');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Check if fix is needed
  if (!packageJson.exports) {
    log('ℹ️  No exports field - package may not need fixing');
    process.exit(0);
  }
  
  const missingExport = './lib/util/container-phrasing.js';
  
  if (packageJson.exports[missingExport]) {
    log('✅ Export already exists - no fix needed');
    process.exit(0);
  }
  
  log('\n🔍 Current exports:');
  log(JSON.stringify(packageJson.exports, null, 2));
  
  // Create backup
  const backupPath = packageJsonPath + '.backup';
  if (!fs.existsSync(backupPath)) {
    log('\n💾 Creating backup...');
    fs.copyFileSync(packageJsonPath, backupPath);
    log(`✅ Backup: ${backupPath}`);
  } else {
    log('\n💾 Backup already exists');
  }
  
  // Add missing export
  log(`\n🔧 Adding missing export: ${missingExport}`);
  
  packageJson.exports[missingExport] = {
    types: './lib/util/container-phrasing.d.ts',
    import: './lib/util/container-phrasing.js',
    default: './lib/util/container-phrasing.js'
  };
  
  // Also add wildcard export for future-proofing
  if (!packageJson.exports['./lib/util/*']) {
    log('🔧 Adding wildcard export: ./lib/util/*');
    packageJson.exports['./lib/util/*'] = {
      types: './lib/util/*.d.ts',
      import: './lib/util/*.js',
      default: './lib/util/*.js'
    };
  }
  
  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  
  log('\n✅ package.json updated successfully!');
  log('\n📊 Updated exports:');
  log(JSON.stringify(packageJson.exports, null, 2));
  
  log('\n✨ Fix complete!');
  log('\n🚀 Next steps:');
  log('   1. Run: npm run content:build');
  log('   2. Run: npm run dev');
  
  process.exit(0);
  
} catch (error) {
  logError('\n❌ Error during fix:', error.message);
  logError('\nStack trace:', error.stack);
  process.exit(1);
}