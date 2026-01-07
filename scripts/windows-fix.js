// scripts/windows-fix.js
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Running Windows build fix...');

// Ensure cache directory exists
const cacheDir = path.join(process.cwd(), '.contentlayer', '.cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log(`✓ Created cache directory: ${cacheDir}`);
}

// Clear any problematic cache
const versionDir = path.join(cacheDir, 'v0.5.8');
if (fs.existsSync(versionDir)) {
  try {
    fs.rmSync(versionDir, { recursive: true, force: true });
    console.log(`✓ Cleared cache version directory: ${versionDir}`);
  } catch (e) {
    console.warn(`⚠ Could not clear cache: ${e.message}`);
  }
}

try {
  // Try to build contentlayer
  console.log('Running contentlayer build...');
  execSync('npx contentlayer2 build', { stdio: 'inherit' });
  console.log('✓ Contentlayer build successful!');
} catch (e) {
  console.warn('⚠ Contentlayer build failed, creating fallback...');
  
  // Create fallback generated content
  const generatedDir = path.join(process.cwd(), '.contentlayer', 'generated');
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
    
    const dummyData = {
      allBooks: [],
      allCanons: [],
      allDownloads: [],
      allEvents: [],
      allPosts: [],
      allPrints: [],
      allResources: [],
      allShorts: [],
      allStrategies: []
    };
    
    // Create CommonJS export
    fs.writeFileSync(
      path.join(generatedDir, 'index.js'),
      `module.exports = ${JSON.stringify(dummyData, null, 2)};`
    );
    
    // Create ES Module export
    fs.writeFileSync(
      path.join(generatedDir, 'index.mjs'),
      `export default ${JSON.stringify(dummyData, null, 2)};`
    );
    
    // Create the contentlayer export file
    const contentlayerDir = path.join(process.cwd(), 'node_modules', '.contentlayer', 'generated');
    if (!fs.existsSync(contentlayerDir)) {
      fs.mkdirSync(contentlayerDir, { recursive: true });
      fs.writeFileSync(
        path.join(contentlayerDir, 'index.mjs'),
        `export default ${JSON.stringify(dummyData, null, 2)};`
      );
    }
    
    console.log('✓ Created fallback contentlayer data');
  }
}

console.log('✅ Windows fix completed!');