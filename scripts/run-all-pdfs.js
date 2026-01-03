#!/usr/bin/env node
// scripts/run-all-pdfs.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function runCommand(name, command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 ${name}`);
    console.log('─'.repeat(50));
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${name} completed\n`);
        resolve();
      } else {
        console.error(`❌ ${name} failed with code ${code}\n`);
        reject(new Error(`${name} failed`));
      }
    });
    
    process.on('error', reject);
  });
}

async function main() {
  try {
    console.log('📚 PDF Generation Pipeline');
    console.log('='.repeat(50));
    
    // 1. Generate standalone PDF
    await runCommand('Generating Ultimate Purpose of Man', 'npx', ['tsx', 'scripts/generate-standalone-pdf.tsx']);
    
    // 2. Generate frameworks PDF
    await runCommand('Generating Strategic Frameworks', 'npx', ['tsx', 'scripts/generate-frameworks-pdf.tsx']);
    
    // 3. Fix and generate legacy canvas
    console.log('🔄 Fixing Legacy Canvas Generator...');
    await fixLegacyCanvas();
    await runCommand('Generating Legacy Architecture Canvas', 'npx', ['tsx', 'scripts/generate-legacy-canvas.tsx']);
    
    // 4. Update generate-pdfs.tsx
    console.log('🔄 Updating generate-pdfs.tsx...');
    await fixGeneratePDFs();
    
    // 5. Run the main PDF generation pipeline
    await runCommand('Running PDF Generation Pipeline', 'npx', ['tsx', 'scripts/generate-pdfs.tsx']);
    
    console.log('🎉 All PDFs generated successfully!');
    console.log('📁 Check: public/assets/downloads/');
    
  } catch (error) {
    console.error('💥 Pipeline failed:', error.message);
    process.exit(1);
  }
}

async function fixLegacyCanvas() {
  const filePath = path.join(__dirname, 'generate-legacy-canvas.tsx');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove the problematic setFont calls
  content = content.replace(/field\.setFont\([^)]+\);/g, '');
  content = content.replace(/field\.setFont\(this\.fonts\.body\);/g, '');
  
  fs.writeFileSync(filePath, content);
  console.log('   ✅ Fixed setFont issues in legacy canvas generator');
}

async function fixGeneratePDFs() {
  const filePath = path.join(__dirname, 'generate-pdfs.tsx');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the import
  content = content.replace(
    /import \{ getPDFRegistry, getAllPDFs, getPDFById, generatePDF \} from '\.\/pdf-registry';/,
    "import { getPDFRegistry, getAllPDFs, getPDFById, generateMissingPDFs } from './pdf-registry';"
  );
  
  // Also fix any usage of generatePDF
  content = content.replace(/generatePDF\(/g, 'generateMissingPDFs(');
  
  fs.writeFileSync(filePath, content);
  console.log('   ✅ Fixed imports in generate-pdfs.tsx');
}

main();