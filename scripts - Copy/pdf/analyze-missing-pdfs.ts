// scripts/pdf/analyze-missing-pdfs.ts
import fs from 'fs';
import path from 'path';

const contentDir = path.join(process.cwd(), 'content/downloads');
const libPdfDir = path.join(process.cwd(), 'lib/pdf');
const outputDir = path.join(process.cwd(), 'public/assets/downloads');

console.log('🔍 ANALYZING MISSING PDFs');
console.log('═'.repeat(60));

// Get all MDX files from content
const mdxFiles = fs.readdirSync(contentDir).filter(f => f.endsWith('.mdx'));
console.log(`📚 Content MDX files: ${mdxFiles.length}`);

// Get existing PDFs in lib/pdf
const libPdfs = fs.readdirSync(libPdfDir).filter(f => f.endsWith('.pdf'));
console.log(`📦 Existing PDFs in lib/pdf: ${libPdfs.length}`);

// Get current output PDFs
const outputPdfs = fs.existsSync(outputDir) 
  ? fs.readdirSync(outputDir).filter(f => f.endsWith('.pdf'))
  : [];
console.log(`📄 Current output PDFs: ${outputPdfs.length}`);

// Calculate expected PDFs from MDX files
const expectedFromMdx = mdxFiles.map(mdx => {
  const baseName = path.basename(mdx, '.mdx');
  return `${baseName}.pdf`;
});

// All expected PDFs (from MDX + existing lib PDFs)
const allExpectedPdfs = [...new Set([...expectedFromMdx, ...libPdfs])];
console.log(`🎯 Total expected PDFs: ${allExpectedPdfs.length}`);

// Find missing PDFs
const missing = allExpectedPdfs.filter(expected => 
  !outputPdfs.some(output => output.includes(path.basename(expected, '.pdf')))
);

console.log('\n❌ MISSING PDFs:');
missing.forEach((pdf, i) => {
  const fromMdx = expectedFromMdx.includes(pdf);
  const fromLib = libPdfs.includes(pdf);
  const source = fromMdx && fromLib ? 'both' : fromMdx ? 'content/mdx' : 'lib/pdf';
  console.log(`${i + 1}. ${pdf} (source: ${source})`);
});

console.log('\n💡 RECOMMENDATIONS:');
console.log('1. You need an MDX-to-PDF converter for all content');
console.log('2. Copy existing PDFs from lib/pdf/ to public folder');
console.log('3. Apply tier-based naming (architect/member/free)');

console.log('═'.repeat(60));
