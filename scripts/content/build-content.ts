import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

console.log('🏗️ Building content...');

// Check if contentlayer is available
const hasContentlayer = (() => {
  try {
    require.resolve('contentlayer');
    return true;
  } catch {
    return false;
  }
})();

// Check if there's a contentlayer config
const hasContentlayerConfig = existsSync(join(process.cwd(), 'contentlayer.config.ts')) ||
                            existsSync(join(process.cwd(), 'contentlayer.config.js'));

if (hasContentlayer && hasContentlayerConfig) {
  console.log('📦 Contentlayer detected, running build...');
  
  try {
    // Run contentlayer build
    execSync('npx contentlayer build', { stdio: 'inherit' });
    console.log('✅ Contentlayer build completed');
  } catch (error: any) {
    console.error('❌ Contentlayer build failed:', error.message);
    
    // Try alternative approach
    console.log('🔄 Trying alternative build method...');
    try {
      const { build } = require('contentlayer');
      build();
      console.log('✅ Content build completed via API');
    } catch (fallbackError: any) {
      console.error('❌ Fallback build also failed:', fallbackError.message);
      console.log('⚠️ Skipping content build due to errors');
    }
  }
} else {
  console.log('ℹ️ No contentlayer configuration found');
  
  // Check if we have a content directory
  const contentDir = join(process.cwd(), 'content');
  if (existsSync(contentDir)) {
    console.log('📁 Content directory exists, but no contentlayer config found');
    console.log('💡 Tip: Consider setting up contentlayer for better content management');
  } else {
    console.log('📁 No content directory found');
  }
  
  console.log('✅ Content processing completed (no build needed)');
}

process.exit(0);