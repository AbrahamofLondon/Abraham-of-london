// scripts/enterprise-asset-optimizer.ts
import { UnifiedPDFGenerator, ContentScanner } from './pdf/unified-pdf-generator';

async function main() {
  console.log('\n\x1b[1;35m🏢 ENTERPRISE ASSET OPTIMIZER\x1b[0m');
  console.log('\x1b[1;37m════════════════════════════════════════════════════════════════════\x1b[0m');
  
  // Use optimal settings for enterprise
  const options = {
    tier: 'all' as const,
    quality: 'enterprise' as const,
    formats: ['A4', 'Letter', 'A3'] as const,
    output: './public/assets/downloads',
    clean: true,
    verbose: true,
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
  
  try {
    const success = await generator.run();
    
    if (success) {
      console.log('\n\x1b[1;32m✅ ENTERPRISE OPTIMIZATION COMPLETE!\x1b[0m');
      console.log('\x1b[90mAll assets have been optimized for enterprise deployment.\x1b[0m');
    } else {
      console.log('\n\x1b[1;33m⚠️  Enterprise optimization completed with warnings\x1b[0m');
      console.log('\x1b[90mSome optimizations may need manual review.\x1b[0m');
    }
    
    process.exit(success ? 0 : 1);
  } catch (error: any) {
    console.error('\n\x1b[1;31m❌ Enterprise optimization failed:\x1b[0m', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  main().catch(console.error);
}

export { main };