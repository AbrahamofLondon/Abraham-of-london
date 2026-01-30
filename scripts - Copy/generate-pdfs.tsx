// scripts/generate-pdfs.tsx - FIXED VERSION
import { generatePDFBatch, verifyGeneratedPDFs } from '../lib/pdf/generate';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// This is now just a thin wrapper for CLI usage
async function main() {
  const args = process.argv.slice(2);
  
  const options = {
    quality: 'premium' as const,
    verbose: false,
    silent: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--quality' && args[i + 1]) {
      options.quality = args[i + 1] as any;
      i++;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--silent' || arg === '-s') {
      options.silent = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
📚 PDF Generation Script

Usage: npx tsx scripts/generate-pdfs.tsx [options]

Options:
  --quality <level>    Set quality: draft, standard, premium, enterprise
  --verbose, -v        Enable verbose/debug logging
  --silent, -s         Silent mode (errors only)
  --help, -h           Show this help message

Examples:
  npx tsx scripts/generate-pdfs.tsx                    # Generate premium PDFs
  npx tsx scripts/generate-pdfs.tsx --quality=enterprise # Enterprise quality
  npx tsx scripts/generate-pdfs.tsx --verbose          # With debug logging
      `);
      process.exit(0);
    }
  }
  
  const config = {
    quality: options.quality,
    logLevel: options.silent ? 'error' : (options.verbose ? 'debug' : 'info')
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('📄 PDF GENERATION STARTED');
  console.log('='.repeat(60));
  
  const result = await generatePDFBatch(config);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATION SUMMARY');
  console.log('='.repeat(60));
  
  result.results.forEach((r, index) => {
    const status = r.success ? '✅' : '❌';
    const duration = r.duration ? ` (${r.duration}ms)` : '';
    const error = r.error ? ` - ${r.error}` : '';
    console.log(`${status} ${index + 1}. ${r.name}${duration}${error}`);
  });
  
  console.log('='.repeat(60));
  console.log(`Total: ${result.summary.total}`);
  console.log(`Successful: ${result.summary.successful}`);
  console.log(`Failed: ${result.summary.failed}`);
  console.log(`Total Time: ${result.summary.totalDuration}ms`);
  console.log('='.repeat(60));
  
  // Verify PDFs
  const pdfs = await verifyGeneratedPDFs(config);
  const validPdfs = pdfs.filter(p => p.isValid).length;
  
  console.log('\n📄 PDF Verification:');
  console.log(`Generated: ${validPdfs}/${pdfs.length} valid PDFs`);
  
  if (result.success && validPdfs === pdfs.length) {
    console.log('\n✨ ALL PDFS GENERATED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.log(`\n⚠ Generated ${validPdfs}/${pdfs.length} PDFs`);
    process.exit(1);
  }
}

// Keep CommonJS support
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${__filename}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export for programmatic use
export { main as runPDFGeneration };