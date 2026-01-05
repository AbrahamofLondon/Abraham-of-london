// scripts/pdf/copy-existing-pdfs.ts
import fs from 'fs';
import path from 'path';

const libPdfDir = path.join(process.cwd(), 'lib/pdf');
const outputDir = path.join(process.cwd(), 'public/assets/downloads');

console.log('📋 COPYING EXISTING PDFs');
console.log('═'.repeat(60));

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const pdfFiles = fs.readdirSync(libPdfDir).filter(f => f.endsWith('.pdf'));
console.log(`Found ${pdfFiles.length} PDFs in lib/pdf`);

let copied = 0;
pdfFiles.forEach(file => {
  const source = path.join(libPdfDir, file);
  const dest = path.join(outputDir, file);
  
  try {
    fs.copyFileSync(source, dest);
    console.log(`✅ ${file}`);
    copied++;
  } catch (error: any) {
    console.log(`❌ ${file}: ${error.message}`);
  }
});

console.log(`\n📊 Copied ${copied}/${pdfFiles.length} PDFs`);
console.log('═'.repeat(60));
