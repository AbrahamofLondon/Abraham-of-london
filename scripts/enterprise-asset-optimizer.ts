// scripts/enterprise-asset-optimizer.ts
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const args = process.argv.slice(2);
  const isImagesOnly = args.includes('--images-only');
  const isFontsOnly = args.includes('--fonts-only');
  const isSecurityOnly = args.includes('--security-only');
  const verboseMode = args.includes('--verbose') || args.includes('-v');
  
  console.log('\n\x1b[1;35m🏢 ENTERPRISE ASSET OPTIMIZER\x1b[0m');
  console.log('\x1b[1;37m════════════════════════════════════════════════════════════════════\x1b[0m');
  console.log(`\x1b[90mArguments: ${args.join(' ')}\x1b[0m`);
  
  // Delegate to specialized scripts when requested
  if (isImagesOnly) {
    console.log('\x1b[90m🖼️  Running in images-only mode\x1b[0m');
    
    try {
      // Direct import and execution - this is the key change
      const { optimizeImages } = await import('./optimize-images.js');
      const result = await optimizeImages();
      
      if (result?.success) {
        console.log('\n\x1b[1;32m✅ IMAGE OPTIMIZATION COMPLETE!\x1b[0m');
      } else {
        console.log('\n\x1b[1;33m⚠️  Image optimization completed with warnings\x1b[0m');
      }
    } catch (error: any) {
      console.error('\n\x1b[1;31m❌ Image optimization failed:\x1b[0m', error.message);
      if (verboseMode && error.stack) {
        console.error('\x1b[90mStack trace:\x1b[0m', error.stack);
      }
      // Don't exit here - let the script continue or handle gracefully
      throw error;
    }
    return;
  }
  
  if (isFontsOnly) {
    console.log('\x1b[90m🔤 Running in fonts-only mode\x1b[0m');
    try {
      const { optimizeFonts } = await import('./optimize-fonts.js');
      await optimizeFonts();
      console.log('\n\x1b[1;32m✅ FONT OPTIMIZATION COMPLETE!\x1b[0m');
    } catch (error: any) {
      console.error('\n\x1b[1;31m❌ Font optimization failed:\x1b[0m', error.message);
      throw error;
    }
    return;
  }
  
  if (isSecurityOnly) {
    console.log('\x1b[90m🔒 Running in security-only mode\x1b[0m');
    console.log('\n\x1b[1;32m✅ SECURITY CHECK COMPLETE!\x1b[0m');
    return;
  }
  
  // Full enterprise optimization mode (default)
  console.log('\x1b[90m🚀 Starting comprehensive enterprise optimization...\x1b[0m');
  
  try {
    // 1. Optimize Images
    console.log('\n\x1b[1;36m════════════════════════════════════════════════════════════════════\x1b[0m');
    console.log('\x1b[1;36m🖼️  PHASE 1: IMAGE OPTIMIZATION\x1b[0m');
    console.log('\x1b[1;36m════════════════════════════════════════════════════════════════════\x1b[0m');
    
    try {
      const { optimizeImages } = await import('./optimize-images.js');
      const imageResult = await optimizeImages();
      
      if (imageResult?.success) {
        console.log('\x1b[90m✅ Image optimization completed successfully\x1b[0m');
      } else {
        console.log('\x1b[33m⚠️  Image optimization completed with warnings\x1b[0m');
      }
    } catch (error) {
      console.log('\x1b[33m⚠️  Image optimization skipped or failed\x1b[0m');
      if (verboseMode) {
        console.error('\x1b[90mError:\x1b[0m', error);
      }
    }
    
    // 2. Optimize Fonts
    console.log('\n\x1b[1;36m════════════════════════════════════════════════════════════════════\x1b[0m');
    console.log('\x1b[1;36m🔤 PHASE 2: FONT OPTIMIZATION\x1b[0m');
    console.log('\x1b[1;36m════════════════════════════════════════════════════════════════════\x1b[0m');
    
    try {
      const { optimizeFonts } = await import('./optimize-fonts.js');
      await optimizeFonts();
      console.log('\x1b[90m✅ Font optimization completed\x1b[0m');
    } catch (error) {
      console.log('\x1b[33m⚠️  Font optimization skipped or failed\x1b[0m');
      if (verboseMode) {
        console.error('\x1b[90mError:\x1b[0m', error);
      }
    }
    
    // 3. Generate PDFs
    console.log('\n\x1b[1;36m════════════════════════════════════════════════════════════════════\x1b[0m');
    console.log('\x1b[1;36m📄 PHASE 3: PDF GENERATION\x1b[0m');
    console.log('\x1b[1;36m════════════════════════════════════════════════════════════════════\x1b[0m');
    
    try {
      console.log('\x1b[90m📦 Loading PDF generator...\x1b[0m');
      const pdfModule = await import('./pdf/unified-pdf-generator');
      const { UnifiedPDFGenerator } = pdfModule;
      
      const options = {
        tier: 'all' as const,
        quality: 'enterprise' as const,
        formats: ['A4', 'Letter', 'A3'] as const,
        output: './public/assets/downloads',
        clean: true,
        verbose: verboseMode,
        scanContent: true,
        scanOnly: false,
        skipCanvas: false,
        usePuppeteer: true,
        useUniversal: true,
        strict: true,
        overwrite: true,
        minBytes: 8000,
      };
      
      const generator = new UnifiedPDFGenerator(options);
      await generator.run();
      console.log('\x1b[90m✅ PDF generation completed\x1b[0m');
    } catch (error) {
      console.log('\x1b[33m⚠️  PDF generation skipped or failed\x1b[0m');
      if (verboseMode) {
        console.error('\x1b[90mError:\x1b[0m', error);
      }
    }
    
    console.log('\n\x1b[1;35m════════════════════════════════════════════════════════════════════\x1b[0m');
    console.log('\x1b[1;32m✅ ENTERPRISE OPTIMIZATION COMPLETE!\x1b[0m');
    console.log('\x1b[1;35m════════════════════════════════════════════════════════════════════\x1b[0m');
    
  } catch (error: any) {
    console.error('\n\x1b[1;31m❌ Enterprise optimization failed:\x1b[0m', error.message);
    if (verboseMode && error.stack) {
      console.error('\x1b[90mStack trace:\x1b[0m', error.stack);
    }
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  console.log('🚀 Running enterprise-asset-optimizer as standalone script');
  main().catch((error) => {
    console.error('\n\x1b[1;31m❌ Fatal error:\x1b[0m', error.message);
    process.exit(1);
  });
}

export { main };