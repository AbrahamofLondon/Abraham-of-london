// scripts/enterprise-asset-optimizer.js

async function main() {
  const args = process.argv.slice(2);
  const isImagesOnly = args.includes('--images-only');
  const isFontsOnly = args.includes('--fonts-only');
  const verbose = args.includes('--verbose') || args.includes('-v');
  const force = args.includes('--force') || args.includes('-f');
  const avif = args.includes('--avif');
  const ultraQuality = args.includes('--ultra-quality');
  
  console.log('\n🏢 ENTERPRISE ASSET OPTIMIZER');
  console.log('════════════════════════════════════════════════════════════════════');
  
  if (isImagesOnly) {
    console.log('🖼️  Running image optimization...');
    
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
        console.log(`Optimized ${result.summary?.optimized || 0}/${result.summary?.total || 0} images`);
        console.log(`Space saved: ${result.summary?.savingsPercent || 0}%`);
        process.exit(0);
      } else {
        console.log('\n⚠️  Image optimization completed with warnings');
        console.log(result.message || 'Check logs for details');
        process.exit(1);
      }
    } catch (error) {
      console.error('\n❌ Image optimization failed:', error.message);
      if (verbose && error.stack) {
        console.error('Stack trace:', error.stack);
      }
      process.exit(1);
    }
  }
  
  // Default: just optimize images
  console.log('🚀 Starting comprehensive optimization...');
  
  try {
    // Set environment variables
    if (force) process.env.FORCE_MODE = 'true';
    if (avif) process.env.GENERATE_AVIF = 'true';
    if (ultraQuality) process.env.ULTRA_QUALITY = 'true';
    
    const { optimizeImages } = await import('./optimize-images.js');
    const result = await optimizeImages();
    
    if (result.success) {
      console.log('\n✅ ENTERPRISE OPTIMIZATION COMPLETE!');
      console.log(`📊 ${result.message}`);
      process.exit(0);
    } else {
      console.log('\n⚠️  Optimization completed with warnings');
      console.log(`📊 ${result.message}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Enterprise optimization failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url.includes(process.argv[1])) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

export { main };