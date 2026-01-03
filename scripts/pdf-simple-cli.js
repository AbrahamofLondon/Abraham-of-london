#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const command = process.argv[2];
const arg = process.argv[3];

if (!command) {
  console.log(`
📚 PDF Management CLI

Usage: node scripts/pdf-simple-cli.js <command> [arg]

Commands:
  list                    List all PDFs in registry
  scan                    Scan for dynamic assets
  status                  Show registry status
  missing                 Generate missing PDFs
  single <id>             Generate single PDF by ID
  legacy                  Generate legacy architecture canvas

Examples:
  node scripts/pdf-simple-cli.js list
  node scripts/pdf-simple-cli.js single ultimate-purpose-of-man
  `);
  process.exit(0);
}

let scriptPath;
let args = [];

switch (command) {
  case 'list':
    scriptPath = path.join(__dirname, 'pdf-registry.ts');
    args = ['--list'];
    break;
    
  case 'scan':
    scriptPath = path.join(__dirname, 'pdf-registry.ts');
    args = ['--scan'];
    break;
    
  case 'status':
    scriptPath = path.join(__dirname, 'pdf-registry.ts');
    args = ['--status'];
    break;
    
  case 'missing':
    scriptPath = path.join(__dirname, 'pdf-registry.ts');
    args = ['--generate-missing'];
    break;
    
  case 'single':
    if (!arg) {
      console.error('❌ Please provide a PDF ID');
      console.error('Usage: node scripts/pdf-simple-cli.js single <pdf-id>');
      process.exit(1);
    }
    scriptPath = path.join(__dirname, 'generate-pdfs.tsx');
    args = [`--single=${arg}`];
    break;
    
  case 'legacy':
    scriptPath = path.join(__dirname, 'generate-legacy-canvas.tsx');
    break;
    
  default:
    console.error(`❌ Unknown command: ${command}`);
    process.exit(1);
}

console.log(`🚀 Running: ${command} ${arg ? arg : ''}\n`);

const tsxProcess = spawn('npx', ['tsx', scriptPath, ...args], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

tsxProcess.on('close', (code) => {
  process.exit(code);
});