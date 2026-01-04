// scripts/generate-pdf-assets.ts - Production Build Optimizer
import { getAllPDFs, getPDFsRequiringGeneration, generateMissingPDFAssets } from './pdf-registry';

export async function buildPDFAssets() {
  console.log('📊 PDF Assets Build Process');
  console.log('='.repeat(50));
  
  const allPDFs = getAllPDFs();
  const missingPDFs = getPDFsRequiringGeneration();
  
  console.log(`Total registered PDFs: ${allPDFs.length}`);
  console.log(`Already available: ${allPDFs.length - missingPDFs.length}`);
  console.log(`Requiring generation: ${missingPDFs.length}`);
  
  if (missingPDFs.length === 0) {
    console.log('✅ All PDF assets are available. No generation needed.');
    return { success: true, generated: 0 };
  }
  
  console.log('\n🔄 Generating missing PDF assets...');
  const results = await generateMissingPDFAssets();
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n📈 Generation Results:');
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n⚠️ Failed generations:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   • ${r.id}: ${r.error}`);
    });
  }
  
  return {
    success: failed === 0,
    generated: successful,
    failed,
    results
  };
}

// Run if this script is called directly
if (require.main === module) {
  buildPDFAssets()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 PDF asset build completed successfully!');
        process.exit(0);
      } else {
        console.error('\n❌ PDF asset build failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error during PDF build:', error);
      process.exit(1);
    });
}