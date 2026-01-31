// scripts/prebuild-ci-gate.js - OPTIMIZED FOR ABRAHAM OF LONDON
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔧 CI/CD Prebuild Gate - Checking environment...');

const skip = process.env.SKIP_ASSET_OPTIMIZE === "1" || 
             process.env.NETLIFY === "true" ||
             process.env.CI === "true";

const optimizedDir = path.join(process.cwd(), 'public', 'optimized-images');

if (skip) {
  const reason = process.env.NETLIFY ? 'Netlify' : 
                 process.env.CI ? 'CI Environment' : 'Manual Skip';
                 
  console.log(`[prebuild] ${reason} detected → skipping heavy optimization.`);

  // CRITICAL: Ensure the directory exists even if empty to prevent Next.js build errors
  if (!fs.existsSync(optimizedDir)) {
    fs.mkdirSync(optimizedDir, { recursive: true });
    console.log(`[prebuild] Created empty ${optimizedDir} to satisfy build paths.`);
  }

  // Check if we have at least SOME images (from a previous cache or commit)
  const files = fs.readdirSync(optimizedDir);
  if (files.length === 0) {
    console.warn('⚠️  WARNING: No optimized images found. Components relying on /optimized-images/ will fail.');
    console.warn('💡 ACTION: Ensure your Next.js components fallback to original source if optimized is missing.');
  }
  
  process.exit(0);
}

// ... rest of your existing "Allow heavy processing" logic ...
console.log('[prebuild] Environment allows heavy processing. Running pnpm assets:optimize...');

try {
  // Use pnpm to match your package manager
  execSync("pnpm assets:optimize", { 
    stdio: "inherit", 
    env: { ...process.env, NODE_ENV: 'production' } 
  });
} catch (error) {
  console.error('[prebuild] Optimization failed, but allowing CI to continue.');
  process.exit(0); 
}