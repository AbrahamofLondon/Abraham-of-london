// scripts/windows-start.mjs
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('🪟 Windows Startup for Abraham of London\n');

// Set Windows-specific environment variables
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
process.env.DISABLE_WINDOWS_FIX = 'false';

// Check for Contentlayer issues
const contentlayerConfigPath = path.join(rootDir, 'contentlayer.config.js');
const hasContentlayerConfig = await fs.access(contentlayerConfigPath).then(() => true).catch(() => false);

if (hasContentlayerConfig) {
  console.log('📚 Contentlayer configuration found');
  
  // Try to pre-build contentlayer
  try {
    console.log('Attempting Contentlayer build...');
    execSync('npx contentlayer2 build', {
      stdio: 'inherit',
      cwd: rootDir,
      env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }
    });
    console.log('✅ Contentlayer build successful');
  } catch (error) {
    console.warn('⚠️ Contentlayer build failed, continuing without it...');
    process.env.DISABLE_CONTENTLAYER = 'true';
  }
} else {
  console.log('ℹ️ No Contentlayer configuration found');
  process.env.DISABLE_CONTENTLAYER = 'true';
}

// Start Next.js dev server
console.log('\n🚀 Starting Next.js development server...\n');
try {
  execSync('npx next dev', {
    stdio: 'inherit',
    cwd: rootDir,
    env: { ...process.env }
  });
} catch (error) {
  console.error('❌ Failed to start dev server:', error.message);
  process.exit(1);
}
