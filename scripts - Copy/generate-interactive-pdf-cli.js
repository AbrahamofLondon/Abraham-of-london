#!/usr/bin/env node
// scripts/generate-interactive-pdf-cli.js - CLI Wrapper
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the actual script
const scriptPath = resolve(__dirname, 'pdf', 'generate-interactive-pdf.ts');

// Check if the script exists
import { existsSync } from 'fs';
if (!existsSync(scriptPath)) {
    console.error('❌ Error: generate-interactive-pdf.ts not found at:', scriptPath);
    console.error('💡 Make sure the file exists at scripts/pdf/generate-interactive-pdf.ts');
    process.exit(1);
}

// Pass all arguments through to tsx
const args = process.argv.slice(2);

console.log('🚀 Interactive PDF Generator CLI');
console.log(`📁 Script: ${scriptPath}`);
console.log(`⚙️  Arguments: ${args.join(' ')}`);
console.log('='.repeat(60));

// Use tsx to run the TypeScript file
const tsxPath = resolve(__dirname, '..', 'node_modules', '.bin', 'tsx');
const child = spawn(tsxPath, [scriptPath, ...args], {
    stdio: 'inherit',
    shell: true
});

child.on('error', (error) => {
    console.error('❌ Failed to start tsx:', error.message);
    process.exit(1);
});

child.on('close', (code) => {
    console.log('='.repeat(60));
    console.log(`📦 Process exited with code: ${code}`);
    process.exit(code || 0);
});
