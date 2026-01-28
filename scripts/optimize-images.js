// scripts/optimize-assets.js - ES MODULE
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const force = args.includes('--force') || args.includes('-f');
  const avif = args.includes('--avif');
  const ultraQuality = args.includes('--ultra-quality');
  
  console.log('\n🏢 ASSET OPTIMIZER');
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('🖼️  Running image optimization...');
  console.log(`📊 Mode: ${force ? 'FORCE' : 'SMART'} | AVIF: ${avif ? 'YES' : 'NO'} | Quality: ${ultraQuality ? 'ULTRA' : 'STANDARD'}`);
  
  // Set environment variables for the optimizer
  if (force) process.env.FORCE_MODE = 'true';
  if (avif) process.env.GENERATE_AVIF = 'true';
  if (ultraQuality) process.env.ULTRA_QUALITY = 'true';
  if (verbose) process.env.VERBOSE_MODE = 'true';
  
  try {
    const { optimizeImages } = await import('./optimize-images.js');
    const result = await optimizeImages();
    
    if (result.success) {
      console.log('\n✅ IMAGE OPTIMIZATION COMPLETE!');
      console.log(`📊 Optimized ${result.summary?.optimized || 0}/${result.summary?.total || 0} images`);
      console.log(`💾 Space saved: ${result.summary?.savingsPercent || 0}%`);
      return { success: true };
    } else {
      console.log('\n⚠️  Image optimization completed with warnings');
      console.log(`📊 ${result.message || 'Check logs for details'}`);
      return { success: false, message: result.message };
    }
  } catch (error) {
    console.error('\n❌ Image optimization failed:', error.message);
    if (verbose && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return { success: false, error: error.message };
  }
}

// Export for module usage
export { main };

// Execute if run directly
if (import.meta.url.includes(process.argv[1])) {
  main().then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}