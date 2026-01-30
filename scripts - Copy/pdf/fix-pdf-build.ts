// NEW: scripts/pdf/fix-pdf-build.ts - PROPER VERSION
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

const downloadDir = path.join(process.cwd(), 'public/assets/downloads');

interface PDFCheckResult {
  isValid: boolean;
  size: number;
  isInteractive: boolean;
  pageCount: number;
  issues: string[];
}

async function analyzePDF(filePath: string): Promise<PDFCheckResult> {
  const result: PDFCheckResult = {
    isValid: false,
    size: 0,
    isInteractive: false,
    pageCount: 0,
    issues: []
  };

  try {
    const stats = fs.statSync(filePath);
    result.size = stats.size;
    
    // Read PDF file
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    result.pageCount = pdfDoc.getPageCount();
    const form = pdfDoc.getForm();
    result.isInteractive = form.getFields().length > 0;
    
    // Different criteria for different PDF types
    if (result.isInteractive) {
      // Interactive forms can be smaller
      result.isValid = result.size > 10000 && result.pageCount === 1;
      if (result.size < 10000) result.issues.push('Too small for interactive PDF');
      if (result.pageCount !== 1) result.issues.push('Should have exactly 1 page');
    } else {
      // Non-interactive PDFs should be larger
      result.isValid = result.size > 50000 && result.pageCount >= 1;
      if (result.size < 50000) result.issues.push('Too small for content PDF');
    }
    
  } catch (error: any) {
    result.issues.push(`Error reading PDF: ${error.message}`);
  }
  
  return result;
}

class PDFBuildFixer {
  async run() {
    console.log('✨ PDF BUILD ANALYZER ✨');
    console.log('════════════════════════════════════════════════════════════════════');
    
    if (!fs.existsSync(downloadDir)) {
      console.log('❌ Download directory does not exist');
      return;
    }
    
    const files = fs.readdirSync(downloadDir);
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
    
    console.log(`Found ${pdfFiles.length} PDF files\n`);
    
    if (pdfFiles.length === 0) {
      console.log('✅ No PDF files to analyze');
      return;
    }
    
    // Group by tier
    const tiers = ['architect', 'member', 'free'];
    const formats = ['a4', 'letter', 'a3'];
    
    let allValid = true;
    
    for (const tier of tiers) {
      console.log(`\n🎯 TIER: ${tier.toUpperCase()}`);
      console.log('─'.repeat(60));
      
      let tierValid = true;
      
      for (const format of formats) {
        const expected = `legacy-architecture-canvas-${format}-premium-${tier}.pdf`;
        const filePath = path.join(downloadDir, expected);
        
        if (!fs.existsSync(filePath)) {
          console.log(`❌ ${expected} - MISSING`);
          tierValid = false;
          allValid = false;
          continue;
        }
        
        const analysis = await analyzePDF(filePath);
        const status = analysis.isValid ? '✅' : '❌';
        
        console.log(`${status} ${expected}`);
        console.log(`   Size: ${(analysis.size / 1024).toFixed(1)} KB`);
        console.log(`   Pages: ${analysis.pageCount}`);
        console.log(`   Type: ${analysis.isInteractive ? 'Interactive Form' : 'Static Content'}`);
        
        if (analysis.issues.length > 0) {
          console.log(`   Issues: ${analysis.issues.join(', ')}`);
          tierValid = false;
          allValid = false;
        }
      }
      
      console.log(tierValid ? '✅ Tier OK' : '❌ Tier has issues');
    }
    
    // Check for unexpected files
    const expectedFiles = tiers.flatMap(tier => 
      formats.map(format => `legacy-architecture-canvas-${format}-premium-${tier}.pdf`)
    );
    
    const unexpected = pdfFiles.filter(f => !expectedFiles.includes(f));
    
    if (unexpected.length > 0) {
      console.log('\n⚠️  UNEXPECTED FILES:');
      unexpected.forEach(f => console.log(`  ${f}`));
    }
    
    console.log('\n════════════════════════════════════════════════════════════════════');
    console.log(allValid ? '✅ ALL PDFS ARE VALID' : '⚠️  SOME PDFS HAVE ISSUES');
    console.log('════════════════════════════════════════════════════════════════════\n');
    
    if (!allValid) {
      console.log('💡 RECOMMENDATIONS:');
      console.log('1. For interactive PDFs: Size should be >10KB, 1 page');
      console.log('2. Run: pnpm pdfs:institutional:cycle --clean');
      console.log('3. Check generate-legacy-canvas.ts for content issues\n');
    }
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const fixer = new PDFBuildFixer();
  fixer.run().catch(console.error);
}

export { PDFBuildFixer, analyzePDF };