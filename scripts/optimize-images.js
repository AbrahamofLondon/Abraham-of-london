// scripts/optimize-images.js — COMPLETE WORKING VERSION

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

console.log('🚀 optimize-images.js starting...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------------------------------------------------------------
// CONFIG
// ----------------------------------------------------------------------------
const CONFIG = {
  sourceDirs: [
    path.join(__dirname, "../public/assets/images"),
    path.join(__dirname, "../public/images"),
  ],
  outputDir: path.join(__dirname, "../public/optimized-images"),
  extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  
  // Optimization settings
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 85,
  concurrentLimit: 4,
  
  // Flags
  force: process.argv.includes('--force') || process.argv.includes('-f'),
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
};

// ----------------------------------------------------------------------------
// LOGGER
// ----------------------------------------------------------------------------
const logger = {
  info: (msg) => console.log(`📸 ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  debug: (msg) => CONFIG.verbose && console.log(`🔍 ${msg}`),
  progress: (msg) => process.stdout.write(`⏳ ${msg}`),
};

// ----------------------------------------------------------------------------
// UTILITY FUNCTIONS
// ----------------------------------------------------------------------------
async function getFileStats(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      mtime: stats.mtime,
      ctime: stats.ctime,
    };
  } catch {
    return null;
  }
}

async function getAllImageFiles() {
  const allFiles = [];
  
  for (const sourceDir of CONFIG.sourceDirs) {
    try {
      await fs.access(sourceDir);
      
      async function scanDirectory(currentPath) {
        let entries;
        try {
          entries = await fs.readdir(currentPath, { withFileTypes: true });
        } catch (error) {
          logger.warning(`Cannot scan ${currentPath}: ${error.message}`);
          return;
        }
        
        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (CONFIG.extensions.includes(ext)) {
              allFiles.push({
                absPath: fullPath,
                name: entry.name,
                ext,
                relPath: path.relative(sourceDir, fullPath),
                sourceDir,
              });
            }
          }
        }
      }
      
      await scanDirectory(sourceDir);
      logger.info(`Found ${allFiles.length} images in ${path.relative(process.cwd(), sourceDir)}`);
      
    } catch (error) {
      logger.warning(`Directory not found: ${sourceDir}`);
    }
  }
  
  return allFiles;
}

// ----------------------------------------------------------------------------
// IMAGE OPTIMIZATION WITH SHARP
// ----------------------------------------------------------------------------
async function optimizeSingleImage(file) {
  const outputPath = path.join(CONFIG.outputDir, file.relPath);
  const outputDir = path.dirname(outputPath);
  
  try {
    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });
    
    // Check if we should skip (file exists and not forcing)
    if (!CONFIG.force) {
      try {
        const sourceStats = await getFileStats(file.absPath);
        const destStats = await getFileStats(outputPath);
        
        if (sourceStats && destStats && destStats.mtime >= sourceStats.mtime) {
          logger.debug(`Skipping (up-to-date): ${file.name}`);
          return {
            file: file.name,
            optimized: false,
            reason: 'up_to_date',
            originalSize: sourceStats.size,
            optimizedSize: destStats.size,
            savings: 0,
          };
        }
      } catch {
        // File doesn't exist, proceed with optimization
      }
    }
    
    // Load sharp
    let sharp;
    try {
      const sharpModule = await import("sharp");
      sharp = sharpModule.default || sharpModule;
    } catch (error) {
      logger.error(`Failed to load sharp: ${error.message}`);
      // Fallback: copy the file
      await fs.copyFile(file.absPath, outputPath);
      return {
        file: file.name,
        optimized: false,
        reason: 'sharp_not_available',
        error: error.message,
      };
    }
    
    // Get source file stats
    const sourceStats = await getFileStats(file.absPath);
    if (!sourceStats) {
      throw new Error(`Cannot read file stats: ${file.name}`);
    }
    
    // Process the image
    let image = sharp(file.absPath);
    
    // Get metadata
    const metadata = await image.metadata();
    
    // Resize if needed
    if (metadata.width > CONFIG.maxWidth || metadata.height > CONFIG.maxHeight) {
      image = image.resize(CONFIG.maxWidth, CONFIG.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    // Apply optimization based on format
    switch (file.ext.toLowerCase()) {
      case '.jpg':
      case '.jpeg':
        await image.jpeg({ quality: CONFIG.quality, progressive: true }).toFile(outputPath);
        break;
      case '.png':
        await image.png({ quality: CONFIG.quality, compressionLevel: 9 }).toFile(outputPath);
        break;
      case '.webp':
        await image.webp({ quality: CONFIG.quality }).toFile(outputPath);
        break;
      case '.gif':
        // Copy GIF as-is (sharp doesn't handle GIF optimization well)
        await fs.copyFile(file.absPath, outputPath);
        return {
          file: file.name,
          optimized: false,
          reason: 'gif_copied_as_is',
          originalSize: sourceStats.size,
          optimizedSize: sourceStats.size,
          savings: 0,
        };
      default:
        // Copy unsupported formats
        await fs.copyFile(file.absPath, outputPath);
        return {
          file: file.name,
          optimized: false,
          reason: 'unsupported_format',
          originalSize: sourceStats.size,
          optimizedSize: sourceStats.size,
          savings: 0,
        };
    }
    
    // Get optimized file stats
    const optimizedStats = await getFileStats(outputPath);
    if (!optimizedStats) {
      throw new Error(`Failed to read optimized file: ${file.name}`);
    }
    
    const savings = sourceStats.size - optimizedStats.size;
    const savingsPercent = sourceStats.size > 0 
      ? ((savings / sourceStats.size) * 100).toFixed(1) 
      : '0';
    
    return {
      file: file.name,
      optimized: true,
      originalSize: sourceStats.size,
      optimizedSize: optimizedStats.size,
      savings,
      savingsPercent,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    };
    
  } catch (error) {
    logger.error(`Failed to optimize ${file.name}: ${error.message}`);
    
    // Try to copy as fallback
    try {
      await fs.copyFile(file.absPath, outputPath);
      const sourceStats = await getFileStats(file.absPath);
      return {
        file: file.name,
        optimized: false,
        reason: 'failed_fallback_copy',
        error: error.message,
        originalSize: sourceStats?.size || 0,
        optimizedSize: sourceStats?.size || 0,
        savings: 0,
      };
    } catch (copyError) {
      return {
        file: file.name,
        optimized: false,
        reason: 'complete_failure',
        error: `${error.message} -> ${copyError.message}`,
      };
    }
  }
}

// ----------------------------------------------------------------------------
// PROCESS IMAGES IN BATCHES
// ----------------------------------------------------------------------------
async function processImagesInBatches(files) {
  const results = [];
  const batchSize = CONFIG.concurrentLimit;
  
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    logger.progress(`Processing ${i + 1}-${Math.min(i + batchSize, files.length)}/${files.length}...\r`);
    
    const batchPromises = batch.map(file => optimizeSingleImage(file));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  console.log(); // Clear the progress line
  return results;
}

// ----------------------------------------------------------------------------
// GENERATE REPORT
// ----------------------------------------------------------------------------
function generateReport(results, startTime) {
  const optimized = results.filter(r => r.optimized);
  const failed = results.filter(r => !r.optimized);
  
  const totalOriginalSize = results.reduce((sum, r) => sum + (r.originalSize || 0), 0);
  const totalOptimizedSize = results.reduce((sum, r) => sum + (r.optimizedSize || 0), 0);
  const totalSavings = totalOriginalSize - totalOptimizedSize;
  const totalSavingsPercent = totalOriginalSize > 0 
    ? ((totalSavings / totalOriginalSize) * 100).toFixed(1) 
    : '0';
  
  const duration = Date.now() - startTime;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMAGE OPTIMIZATION REPORT');
  console.log('='.repeat(60));
  console.log(`📁 Total images: ${results.length}`);
  console.log(`✅ Successfully optimized: ${optimized.length}`);
  console.log(`⚠️  Not optimized: ${failed.length}`);
  
  console.log('\n💾 SIZE ANALYSIS:');
  console.log(`   Original total: ${(totalOriginalSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   Optimized total: ${(totalOptimizedSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   Space saved: ${(totalSavings / (1024 * 1024)).toFixed(2)} MB (${totalSavingsPercent}%)`);
  
  console.log(`\n⏱️  PERFORMANCE:`);
  console.log(`   Duration: ${(duration / 1000).toFixed(1)} seconds`);
  console.log(`   Rate: ${(results.length / (duration / 1000)).toFixed(1)} images/second`);
  
  if (failed.length > 0) {
    const reasons = {};
    failed.forEach(result => {
      const reason = result.reason || 'unknown';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });
    
    console.log('\n⚠️  NON-OPTIMIZED REASONS:');
    Object.entries(reasons).forEach(([reason, count]) => {
      console.log(`   • ${reason}: ${count}`);
    });
  }
  
  console.log('='.repeat(60));
  
  return {
    total: results.length,
    optimized: optimized.length,
    failed: failed.length,
    originalSize: totalOriginalSize,
    optimizedSize: totalOptimizedSize,
    savings: totalSavings,
    savingsPercent: totalSavingsPercent,
    duration,
  };
}

// ----------------------------------------------------------------------------
// MAIN OPTIMIZATION FUNCTION
// ----------------------------------------------------------------------------
async function optimizeImages() {
  const startTime = Date.now();
  
  logger.info('Starting image optimization...');
  logger.info(`Output directory: ${CONFIG.outputDir}`);
  logger.info(`Mode: ${CONFIG.force ? 'FORCE (re-optimize all)' : 'SMART (skip up-to-date)'}`);
  
  // Create output directory
  try {
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    logger.success(`Created output directory`);
  } catch (error) {
    logger.error(`Failed to create output directory: ${error.message}`);
    return { success: false, error: error.message };
  }
  
  // Get all image files
  logger.info('Scanning for images...');
  const files = await getAllImageFiles();
  
  if (files.length === 0) {
    logger.warning('No images found to optimize.');
    logger.info('Please add images to:');
    CONFIG.sourceDirs.forEach(dir => {
      logger.info(`   - ${dir}`);
    });
    return { success: true, message: "No images found" };
  }
  
  logger.info(`Found ${files.length} images to process`);
  
  // Process images
  logger.info(`Processing images (concurrency: ${CONFIG.concurrentLimit})...`);
  const results = await processImagesInBatches(files);
  
  // Generate and display report
  const report = generateReport(results, startTime);
  
  // Save detailed report
  try {
    const reportPath = path.join(CONFIG.outputDir, "optimization-report.json");
    const detailedReport = {
      timestamp: new Date().toISOString(),
      config: CONFIG,
      summary: report,
      files: results.map(r => ({
        file: r.file,
        optimized: r.optimized,
        reason: r.reason,
        originalSize: r.originalSize,
        optimizedSize: r.optimizedSize,
        savings: r.savings,
        savingsPercent: r.savingsPercent,
        error: r.error,
      })),
    };
    
    await fs.writeFile(reportPath, JSON.stringify(detailedReport, null, 2));
    logger.success(`Detailed report saved: ${reportPath}`);
  } catch (error) {
    logger.warning(`Failed to save report: ${error.message}`);
  }
  
  // Determine success
  const success = report.failed < report.total * 0.5; // Less than 50% failures
  
  if (success) {
    logger.success('Optimization completed successfully!');
    return { 
      success: true, 
      summary: report,
      message: `Optimized ${report.optimized}/${report.total} images, saved ${report.savingsPercent}% space`
    };
  } else {
    logger.warning('Optimization completed with issues');
    return { 
      success: false, 
      summary: report,
      message: `Failed to optimize ${report.failed}/${report.total} images`
    };
  }
}

// ----------------------------------------------------------------------------
// EXECUTE IMMEDIATELY
// ----------------------------------------------------------------------------

// Global error handlers
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
      console.log(`📊 ${result.message}`);
      process.exit(0);
    } else {
      console.log('\n⚠️  Script completed with warnings');
      console.log(`📊 ${result.message}`);
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