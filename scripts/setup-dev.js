// scripts/setup-dev.js
import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

console.log(`\n${YELLOW}🚀 Abraham of London - Automated Dev Setup Starting...${RESET}`);

// 1. Break File Locks (Windows Only) - NON-BLOCKING
console.log(`\n${YELLOW}[1/5] Breaking file locks...${RESET}`);
if (process.platform === 'win32') {
  // We use 'exec' (async) instead of 'execSync' to prevent the script from hanging
  exec('taskkill /F /IM node.exe /T 2>nul');
  console.log(`${GREEN}  Signal sent to clear Node locks. Continuing...${RESET}`);
}

// Small delay to allow Windows to acknowledge the taskkill signal
setTimeout(() => {
  try {
    // 2. Comprehensive Clean
    console.log(`\n${YELLOW}[2/5] Cleaning project bloat...${RESET}`);
    // Run our clean script directly - targeting the directories
    execSync('node scripts/clean-project.js', { stdio: 'inherit' });

    // 3. Manual deletion of persistent large files (The 304MB Hunter)
    console.log(`\n${YELLOW}[3/5] Targeting stubborn large files...${RESET}`);
    const stubbornFiles = [
      '_emergency-backup.tar',
      'nvm-setup.exe',
      'nvm-setup.zip',
      '_emergency-backup.tar.bak'
    ];

    stubbornFiles.forEach(file => {
      const filePath = path.resolve(file);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`${GREEN}  Successfully deleted: ${file}${RESET}`);
        } catch (err) {
          console.log(`${RED}  Could not delete ${file} (likely still locked): ${err.message}${RESET}`);
        }
      }
    });

    // 4. Fresh Install
    console.log(`\n${YELLOW}[4/5] Installing fresh dependencies...${RESET}`);
    execSync('pnpm install', { stdio: 'inherit' });

    // 5. Final Audit
    console.log(`\n${YELLOW}[5/5] Running final asset audit...${RESET}`);
    execSync('node scripts/audit-assets.js', { stdio: 'inherit' });

    console.log(`\n${GREEN}✨ Setup Complete! Your environment is lean.${RESET}\n`);

  } catch (error) {
    console.error(`\n${RED}❌ Setup encountered an issue:${RESET}`, error.message);
  }
}, 1000); // 1 second buffer