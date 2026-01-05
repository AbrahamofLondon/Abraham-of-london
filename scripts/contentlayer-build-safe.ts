// scripts/contentlayer-build-safe.ts - ES Module Version
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export async function runContentlayer(): Promise<boolean> {
  console.log('📚 Building Contentlayer (Windows-safe)...');
  
  try {
    // Method 1: Direct build
    console.log('🔄 Method 1: Direct contentlayer build...');
    execSync('contentlayer build', { 
      stdio: 'inherit',
      windowsHide: true 
    });
    
    console.log('✅ Contentlayer build completed');
    return true;
    
  } catch (error: any) {
    console.warn('⚠️ Standard build failed, trying alternative method...');
    
    try {
      // Method 2: Run via npx
      console.log('🔄 Method 2: npx contentlayer build...');
      execSync('npx contentlayer build', {
        stdio: 'inherit',
        windowsHide: true
      });
      
      console.log('✅ Contentlayer build completed (via npx)');
      return true;
      
    } catch (npxError: any) {
      console.error('❌ Both Contentlayer build methods failed');
      console.error('Direct build error:', error.message);
      console.error('npx build error:', npxError.message);
      
      // Check for existing generated content
      const contentlayerDir = path.join(process.cwd(), '.contentlayer');
      if (fs.existsSync(contentlayerDir)) {
        try {
          const generatedDir = path.join(contentlayerDir, 'generated');
          if (fs.existsSync(generatedDir)) {
            const files = fs.readdirSync(generatedDir).filter(f => f.endsWith('.json'));
            console.log(`📁 Found ${files.length} existing generated files in .contentlayer/generated/`);
            
            if (files.length > 0) {
              console.log('⚠️ Using existing generated content (files found)');
              return true;
            }
          }
          
          // Check for root level .json files
          const rootFiles = fs.readdirSync(contentlayerDir).filter(f => f.endsWith('.json'));
          if (rootFiles.length > 0) {
            console.log(`📁 Found ${rootFiles.length} existing generated files in .contentlayer/`);
            console.log('⚠️ Using existing generated content');
            return true;
          }
        } catch (scanError) {
          console.error('Failed to scan .contentlayer directory:', scanError);
        }
      }
      
      console.error('💥 No existing content found. Build failed.');
      return false;
    }
  }
}

// ES Module check for main execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  runContentlayer().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

// Export for programmatic use
export default runContentlayer;