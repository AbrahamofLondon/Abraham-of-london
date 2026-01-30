#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const scriptName = process.argv[2];
if (!scriptName) {
  console.log('Usage: node scripts/run-pdf-script.js <script-name>');
  console.log('Available scripts:');
  console.log('  - standalone: Generate Ultimate Purpose of Man PDF');
  console.log('  - frameworks: Generate Strategic Frameworks PDF');
  console.log('  - legacy: Generate Legacy Architecture Canvas');
  console.log('  - all: Generate all PDFs');
  process.exit(1);
}

const scripts = {
  standalone: 'generate-standalone-pdf.tsx',
  frameworks: 'generate-frameworks-pdf.tsx',
  legacy: 'generate-legacy-canvas.tsx',
  all: 'generate-pdfs.js'
};

const scriptFile = scripts[scriptName];
if (!scriptFile) {
  console.error(`Unknown script: ${scriptName}`);
  process.exit(1);
}

const scriptPath = path.join(__dirname, scriptFile);
if (!fs.existsSync(scriptPath)) {
  console.error(`Script not found: ${scriptPath}`);
  process.exit(1);
}

console.log(`🚀 Running: ${scriptFile}`);
console.log('='.repeat(50));

const process = spawn('npx', ['tsx', scriptPath], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

process.on('close', (code) => {
  console.log('='.repeat(50));
  if (code === 0) {
    console.log('✅ Script completed successfully');
  } else {
    console.error(`❌ Script failed with code ${code}`);
  }
  process.exit(code);
});

process.on('error', (error) => {
  console.error('💥 Process error:', error.message);
  process.exit(1);
});