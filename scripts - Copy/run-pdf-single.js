#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const id = process.argv[2];
if (!id) {
  console.error('❌ Please provide a PDF ID');
  console.error('Usage: npm run pdfs:single <pdf-id>');
  process.exit(1);
}

const generatePdfsPath = path.join(__dirname, 'generate-pdfs.tsx');
const tsxProcess = spawn('npx', ['tsx', generatePdfsPath, '--single=' + id], {
  stdio: 'inherit',
  shell: true
});

tsxProcess.on('close', (code) => {
  process.exit(code);
});