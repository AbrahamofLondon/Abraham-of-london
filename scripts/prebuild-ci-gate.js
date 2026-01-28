// scripts/prebuild-ci-gate.js - ES MODULE VERSION
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔧 CI/CD Prebuild Gate - Checking environment...');
console.log('📁 Current directory:', process.cwd());
console.log('📄 Node version:', process.version);
console.log('🏷️  NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('🌐 NETLIFY:', process.env.NETLIFY || 'false');
console.log('🔄 CI:', process.env.CI || 'false');
console.log('🚫 SKIP_ASSET_OPTIMIZE:', process.env.SKIP_ASSET_OPTIMIZE || 'not set');

// Check if we should skip heavy optimization
const skip = process.env.SKIP_ASSET_OPTIMIZE === "1" || 
             process.env.NETLIFY === "true" ||
             process.env.CI === "true";

if (skip) {
  const reason = process.env.NETLIFY ? 'Netlify' : 
                 process.env.CI ? 'CI Environment' : 
                 process.env.SKIP_ASSET_OPTIMIZE ? 'SKIP_ASSET_OPTIMIZE flag' : 
                 'Unknown';
  console.log(`[prebuild] ${reason} detected → skipping heavy optimization steps.`);
  
  // Check if optimized images already exist
  const optimizedDir = path.join(process.cwd(), 'public', 'optimized-images');
  if (fs.existsSync(optimizedDir)) {
    console.log('[prebuild] Optimized images already exist, skipping generation.');
  } else {
    console.log('[prebuild] No optimized images found, but skipping due to CI environment.');
  }
  
  process.exit(0);
}

console.log('[prebuild] Running full asset optimization...');
console.log('[prebuild] Environment allows heavy processing.');

try {
  // Check if required scripts exist
  const scriptsToCheck = [
    'scripts/optimize-images.js',
    'scripts/optimize-assets.js'
  ];
  
  let allScriptsExist = true;
  for (const script of scriptsToCheck) {
    const scriptPath = path.join(process.cwd(), script);
    if (!fs.existsSync(scriptPath)) {
      console.error(`[prebuild] Missing required script: ${script}`);
      allScriptsExist = false;
    }
  }
  
  if (!allScriptsExist) {
    console.error('[prebuild] Required optimization scripts are missing.');
    console.error('[prebuild] Creating basic optimized directory structure...');
    
    // Create minimal structure
    const publicDir = path.join(process.cwd(), 'public');
    const optimizedDir = path.join(publicDir, 'optimized-images');
    
    if (!fs.existsSync(optimizedDir)) {
      fs.mkdirSync(optimizedDir, { recursive: true });
      console.log(`[prebuild] Created directory: ${optimizedDir}`);
      
      // Create a placeholder file
      const placeholder = {
        timestamp: new Date().toISOString(),
        message: "Optimization skipped in CI - using placeholder",
        note: "Run locally with 'npm run assets:optimize' to generate optimized images"
      };
      
      fs.writeFileSync(
        path.join(optimizedDir, 'ci-placeholder.json'),
        JSON.stringify(placeholder, null, 2)
      );
      console.log('[prebuild] Created CI placeholder file.');
    }
    
    process.exit(0);
  }
  
  console.log('[prebuild] All required scripts found, proceeding with optimization...');
  
  // Run asset optimization
  execSync("npm run assets:optimize", { 
    stdio: "inherit",
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  console.log('[prebuild] Asset optimization completed successfully.');
} catch (error) {
  console.error('[prebuild] Asset optimization failed:', error.message);
  
  // Don't fail the build in CI - just warn and continue
  if (process.env.CI === "true" || process.env.NETLIFY === "true") {
    console.log('[prebuild] Continuing build despite optimization errors (CI mode).');
    console.log('[prebuild] This is expected in CI environments with limited resources.');
    
    // Ensure optimized directory exists
    const optimizedDir = path.join(process.cwd(), 'public', 'optimized-images');
    if (!fs.existsSync(optimizedDir)) {
      try {
        fs.mkdirSync(optimizedDir, { recursive: true });
        console.log(`[prebuild] Created fallback directory: ${optimizedDir}`);
      } catch (mkdirError) {
        console.error('[prebuild] Failed to create fallback directory:', mkdirError.message);
      }
    }
    
    process.exit(0);
  } else {
    console.error('[prebuild] Failing build in non-CI environment.');
    process.exit(1);
  }
}