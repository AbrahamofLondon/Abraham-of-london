// scripts/enterprise-asset-optimizer.js - SIMPLE ENTRY POINT
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const force = args.includes('--force') || args.includes('-f');
  const avif = args.includes('--avif');
  const ultraQuality = args.includes('--ultra-quality');
  
  console.log('\n🏢 ENTERPRISE ASSET OPTIMIZER');
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('🖼️  Running image optimization...');
  
  // Delegate to optimize-assets.js
  const { spawnSync } = await import('child_process');
  
  const childArgs = ['node', 'scripts/optimize-assets.js'];
  if (force) childArgs.push('--force');
  if (avif) childArgs.push('--avif');
  if (ultraQuality) childArgs.push('--ultra-quality');
  if (verbose) childArgs.push('--verbose');
  
  const result = spawnSync('node', childArgs.slice(1), {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  if (result.status === 0) {
    console.log('\n✅ ENTERPRISE OPTIMIZATION COMPLETE!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Enterprise optimization completed with warnings');
    process.exit(1);
  }
}

// Export for module usage
export { main };

// Execute if run directly
if (import.meta.url.includes(process.argv[1])) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}