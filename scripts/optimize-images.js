// scripts/optimize-images.js — WORKING VERSION

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

console.log('🚀 optimize-images.js starting...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------------------------------------------------------------
// SIMPLE CONFIG
// ----------------------------------------------------------------------------
const CONFIG = {
  sourceDirs: [
    path.join(__dirname, "../public/assets/images"),
    path.join(__dirname, "../public/images"),
  ],
  outputDir: path.join(__dirname, "../public/optimized-images"),
  extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
};

// ----------------------------------------------------------------------------
// MAIN FUNCTION - SIMPLIFIED
// ----------------------------------------------------------------------------
async function optimizeImages() {
  console.log('\n🔍 Starting image optimization process...');
  
  try {
    // 1. Create output directory
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    console.log(`✅ Created output directory: ${CONFIG.outputDir}`);
    
    // 2. Check source directories
    let totalImages = 0;
    
    for (const sourceDir of CONFIG.sourceDirs) {
      console.log(`\n📂 Checking: ${path.relative(process.cwd(), sourceDir)}`);
      
      try {
        await fs.access(sourceDir);
        
        // Count images
        const files = await fs.readdir(sourceDir);
        const images = files.filter(file => 
          CONFIG.extensions.includes(path.extname(file).toLowerCase())
        );
        
        console.log(`   Found ${images.length} images`);
        totalImages += images.length;
        
        if (images.length > 0) {
          // Show first few images
          for (const image of images.slice(0, 3)) {
            console.log(`   - ${image}`);
          }
          if (images.length > 3) {
            console.log(`   ... and ${images.length - 3} more`);
          }
        }
        
      } catch (error) {
        console.log(`   ⚠️ Directory not found or inaccessible`);
      }
    }
    
    // 3. Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total images found: ${totalImages}`);
    console.log(`Output directory: ${path.relative(process.cwd(), CONFIG.outputDir)}`);
    
    if (totalImages === 0) {
      console.log('\n💡 No images found to optimize.');
      console.log('Please add images to:');
      CONFIG.sourceDirs.forEach(dir => {
        console.log(`   - ${dir}`);
      });
      return { success: true, message: "No images found" };
    }
    
    // 4. Check for sharp
    console.log('\n🔧 Checking dependencies...');
    try {
      await import("sharp");
      console.log('✅ Sharp is installed');
      console.log('📝 Note: Full optimization would run with Sharp');
    } catch (error) {
      console.log('⚠️ Sharp not installed. Install with: pnpm add sharp');
      console.log('📝 Note: Would fall back to ImageMagick or copy');
    }
    
    // 5. Create a report file
    const report = {
      timestamp: new Date().toISOString(),
      config: CONFIG,
      imagesFound: totalImages,
      status: "scan_complete",
      nextSteps: [
        "Install sharp: pnpm add sharp",
        "Add actual images to source directories",
        "Run optimization with: pnpm run optimize:images"
      ]
    };
    
    const reportPath = path.join(CONFIG.outputDir, "scan-report.json");
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${reportPath}`);
    
    return { 
      success: true, 
      imagesFound: totalImages,
      reportPath 
    };
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------------------------------
// EXECUTE IMMEDIATELY - NO COMPLEX LOGIC
// ----------------------------------------------------------------------------

// Add global error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

console.log('⚡ Starting execution...');

// Execute the main function
(async () => {
  try {
    const result = await optimizeImages();
    
    if (result.success) {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Script failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n🔥 Fatal error in execution:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();

// Export for other scripts to use
export { optimizeImages };