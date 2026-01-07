/* scripts/contentlayer-build-safe.ts - Safe Contentlayer build script */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting SAFE Contentlayer build process...');
console.log(`📁 Current directory: ${process.cwd()}`);
console.log(`📁 Node version: ${process.version}`);

try {
  // 1. Clean any existing contentlayer cache
  console.log('🧹 Cleaning previous Contentlayer cache...');
  const contentlayerDir = path.join(process.cwd(), '.contentlayer');
  if (fs.existsSync(contentlayerDir)) {
    fs.rmSync(contentlayerDir, { recursive: true, force: true });
    console.log('✅ Contentlayer cache cleaned');
  }

  // 2. Run Contentlayer2 build
  console.log('🔨 Running Contentlayer2 build...');
  execSync('contentlayer2 build', {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  // 3. Verify the build
  console.log('🔍 Verifying Contentlayer build...');
  const generatedDir = path.join(contentlayerDir, 'generated');
  
  if (fs.existsSync(generatedDir)) {
    const files = fs.readdirSync(generatedDir);
    console.log(`✅ Contentlayer build successful! Found ${files.length} files:`);
    files.forEach(file => {
      const filePath = path.join(generatedDir, file);
      const stats = fs.statSync(filePath);
      console.log(`   - ${file} (${stats.isDirectory() ? 'dir' : `${(stats.size / 1024).toFixed(2)}KB`})`);
    });
  } else {
    console.error('❌ Contentlayer build failed: .contentlayer/generated not found');
    process.exit(1);
  }

  // 4. Create a compatibility symlink if needed
  try {
    const compatFile = path.join(process.cwd(), 'lib', 'contentlayer-compat.ts');
    if (fs.existsSync(compatFile)) {
      console.log('🔗 Contentlayer compatibility layer is in place');
    } else {
      console.warn('⚠️  Contentlayer compatibility layer not found');
    }
  } catch (error) {
    console.warn('⚠️  Could not check compatibility layer:', error);
  }

  console.log('🎉 Contentlayer build completed successfully!');
} catch (error) {
  console.error('❌ Contentlayer build failed:', error);
  process.exit(1);
}