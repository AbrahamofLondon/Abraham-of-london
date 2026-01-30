// scripts/fix-pdf-build.ts - SIMPLIFIED VERSION
import fs from 'fs';
import path from 'path';

const downloadDir = path.join(process.cwd(), 'public/assets/downloads');

console.log('✨ PDF BUILD FIXER ✨');
console.log('════════════════════════════════════════════════════════════════════');

if (!fs.existsSync(downloadDir)) {
  console.log('❌ Download directory does not exist:', downloadDir);
  console.log('   Creating directory...');
  fs.mkdirSync(downloadDir, { recursive: true });
}

const files = fs.readdirSync(downloadDir);
const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

console.log(`Found ${pdfFiles.length} PDF files in ${downloadDir}\n`);

if (pdfFiles.length === 0) {
  console.log('✅ No PDF files to fix');
  process.exit(0);
}

console.log('📄 Current PDF files:');
pdfFiles.forEach(file => {
  const filePath = path.join(downloadDir, file);
  const stats = fs.statSync(filePath);
  console.log(`  ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
});

console.log('\n🔍 Checking for issues...\n');

const issues = {
  smallFiles: [] as string[],
  incorrectNames: [] as string[],
  missingFiles: [] as string[]
};

const tiers = ['architect', 'member', 'free'];
const formats = ['a4', 'letter', 'a3'];
const quality = 'premium';

// Check file sizes
pdfFiles.forEach(file => {
  const filePath = path.join(downloadDir, file);
  const stats = fs.statSync(filePath);
  if (stats.size < 50000) {
    issues.smallFiles.push(`${file} (${stats.size} bytes)`);
  }
});

// Check expected files
tiers.forEach(tier => {
  formats.forEach(format => {
    const expected = `legacy-architecture-canvas-${format}-${quality}-${tier}.pdf`;
    if (!pdfFiles.includes(expected)) {
      issues.missingFiles.push(expected);
    }
  });
});

console.log('📊 ISSUES FOUND:');
if (issues.smallFiles.length > 0) {
  console.log('\n⚠️  SMALL FILES (< 50KB):');
  issues.smallFiles.forEach(file => console.log(`  ${file}`));
}

if (issues.missingFiles.length > 0) {
  console.log('\n❌ MISSING FILES:');
  issues.missingFiles.forEach(file => console.log(`  ${file}`));
}

if (issues.smallFiles.length === 0 && issues.missingFiles.length === 0) {
  console.log('\n✅ BUILD IS CLEAN AND VALID');
} else {
  console.log('\n⚠️  BUILD HAS ISSUES');
  console.log('   Run: pnpm pdfs:institutional:cycle --clean');
}

console.log('════════════════════════════════════════════════════════════════════');