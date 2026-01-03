#!/usr/bin/env node
// Use require for Node.js compatibility
const { spawn } = require('child_process');
const path = require('path');

async function runTSX(scriptName) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    const process = spawn('npx', ['tsx', scriptPath], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });
    
    process.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Process exited with code ${code}`));
    });
    
    process.on('error', reject);
  });
}

// Get script name from command line
const scriptName = process.argv[2];
if (!scriptName) {
  console.error('Usage: node scripts/run-tsx.js <script-name.tsx>');
  process.exit(1);
}

runTSX(scriptName).catch(error => {
  console.error('Script execution failed:', error.message);
  process.exit(1);
});