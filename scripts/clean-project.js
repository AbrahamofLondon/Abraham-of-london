// scripts/clean-project.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Consolidated targets from your original rimraf + new architecture
const targets = [
  'node_modules',
  '.next',
  '.contentlayer',
  '.turbo',
  '.cache',
  '.wfix',
  'public/optimized-images',
  'tsconfig.tsbuildinfo'
];

console.log('🧹 Abraham of London - Consolidated Deep Clean starting...');

// 1. Break File Locks (Windows Only)
if (process.platform === 'win32') {
  try {
    // Kills any lingering node processes to prevent EPERM
    execSync('taskkill /F /IM node.exe /T 2>nul || exit 0', { shell: true });
    console.log('✅ Terminated lingering Node processes.');
  } catch (e) { /* silent skip */ }
}

// 2. Execute Deletion
targets.forEach(target => {
  const fullPath = path.resolve(target);
  if (fs.existsSync(fullPath)) {
    try {
      if (process.platform === 'win32') {
        // Native Windows rmdir is more authoritative than rimraf for locked files
        const isDir = fs.lstatSync(fullPath).isDirectory();
        if (isDir) {
          execSync(`rmdir /s /q "${fullPath}"`, { stdio: 'inherit' });
        } else {
          execSync(`del /f /q "${fullPath}"`, { stdio: 'inherit' });
        }
      } else {
        execSync(`rm -rf "${fullPath}"`, { stdio: 'inherit' });
      }
      console.log(`✅ Removed: ${target}`);
    } catch (err) {
      console.warn(`⚠️  Partial failure on ${target}: ${err.message}`);
    }
  }
});

console.log('✨ Project root is now clean. Ready for "pnpm install".');