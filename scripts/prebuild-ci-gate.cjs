// scripts/prebuild-ci-gate.js - CI/CD PREBUILD GATE

const { execSync } = require("child_process");

console.log('🔧 CI/CD Prebuild Gate - Checking environment...');

// Check if we should skip heavy optimization
const skip = process.env.SKIP_ASSET_OPTIMIZE === "1" || 
             process.env.NETLIFY === "true" ||
             process.env.CI === "true" ||
             process.argv.includes('--skip-optimize');

if (skip) {
  const reason = process.env.NETLIFY ? 'Netlify' : 
                 process.env.CI ? 'CI Environment' : 
                 'SKIP_ASSET_OPTIMIZE flag';
  console.log(`[prebuild] ${reason} detected → skipping heavy optimization steps.`);
  process.exit(0);
}

console.log('[prebuild] Running full asset optimization...');

try {
  // Run asset optimization
  execSync("pnpm run assets:optimize", { 
    stdio: "inherit",
    cwd: process.cwd()
  });
  
  console.log('[prebuild] Asset optimization completed successfully.');
} catch (error) {
  console.error('[prebuild] Asset optimization failed:', error.message);
  
  // Only fail in CI, not in development
  if (process.env.CI === "true") {
    process.exit(1);
  } else {
    console.log('[prebuild] Continuing build despite optimization errors (development mode).');
    process.exit(0);
  }
}