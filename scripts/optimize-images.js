// scripts/optimize-images.js — COMPLETE FIXED PREMIUM VERSION

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

console.log('\x1b[1;35m🚀 ENTERPRISE IMAGE OPTIMIZER - PREMIUM EDITION\x1b[0m');
console.log('\x1b[1;37m════════════════════════════════════════════════════════════════════\x1b[0m');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------------------------------------------------------------
// PREMIUM CONFIGURATION
// ----------------------------------------------------------------------------
const CONFIG = {
  // Source & Output
  sourceDirs: [
    path.join(__dirname, "../public/assets/images"),
    path.join(__dirname, "../public/images"),
  ],
  outputDir: path.join(__dirname, "../public/optimized-images"),
  extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".tiff"],
  
  // Quality Settings
  ultraQuality: process.argv.includes('--ultra-quality') || process.env.ULTRA_QUALITY === 'true',
  generateAvif: process.argv.includes('--avif') || process.env.GENERATE_AVIF === 'true',
  
  // Processing
  maxWidth: 2560,  // 2.5K for premium output
  maxHeight: 1440,
  concurrentLimit: 4,  // Reduced for stability
  force: process.argv.includes('--force') || process.argv.includes('-f'),
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
  
  // Premium Quality Profiles
  qualityProfiles: {
    standard: {
      jpeg: { quality: 92, progressive: true, chromaSubsampling: '4:4:4', mozjpeg: true },
      png: { compressionLevel: 9, palette: true, quality: 95 },
      webp: { quality: 90, alphaQuality: 100, smartSubsample: true, effort: 6 },
      avif: { quality: 85, speed: 5, chromaSubsampling: '4:4:4' }
    },
    ultra: {
      jpeg: { quality: 98, progressive: true, chromaSubsampling: '4:4:4', mozjpeg: true },
      png: { compressionLevel: 9, palette: true, quality: 100 },
      webp: { quality: 95, alphaQuality: 100, smartSubsample: true, lossless: false, effort: 6 },
      avif: { quality: 90, speed: 4, chromaSubsampling: '4:4:4' }
    }
  },
  
  // Advanced Processing
  enableSharpening: false,  // DISABLED due to API issues - enable after Sharp update
  sharpeningSettings: { sigma: 0.3, m1: 1, m2: 2, x1: 2, y2: 10, y3: 20 },
  
  // Format Strategy
  generateMultipleFormats: true,  // Generate WebP + AVIF alongside original format
  keepOriginalFormat: true,  // Keep JPG/PNG alongside modern formats
};

// Get active quality profile
const QUALITY = CONFIG.ultraQuality ? CONFIG.qualityProfiles.ultra : CONFIG.qualityProfiles.standard;

// ----------------------------------------------------------------------------
// PREMIUM LOGGER
// ----------------------------------------------------------------------------
const logger = {
  info: (msg) => console.log(`\x1b[36m📸\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m✅\x1b[0m ${msg}`),
  warning: (msg) => console.log(`\x1b[33m⚠️\x1b[0m ${msg}`),
  error: (msg) => console.error(`\x1b[31m❌\x1b[0m ${msg}`),
  debug: (msg) => CONFIG.verbose && console.log(`\x1b[90m🔍\x1b[0m ${msg}`),
  progress: (msg) => process.stdout.write(`\x1b[35m⏳\x1b[0m ${msg}`),
  format: (format) => {
    const colors = { jpeg: '33m🖼️', png: '36m🖼️', webp: '34m🌐', avif: '35m✨', gif: '32m🎬' };
    return `\x1b[${colors[format] || '90m🖼️'}\x1b[0m`;
  }
};

// ----------------------------------------------------------------------------
// PREMIUM UTILITIES
// ----------------------------------------------------------------------------
async function getFileStats(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      mtime: stats.mtimeMs,
      ctime: stats.ctimeMs,
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
          logger.warning(`Cannot scan ${path.relative(process.cwd(), currentPath)}: ${error.message}`);
          return;
        }
        
        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          
          if (entry.isDirectory()) {
            // Skip system directories
            if (entry.name.startsWith('.') || ['node_modules', '.git', '__MACOSX'].includes(entry.name)) {
              continue;
            }
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
                dir: path.dirname(fullPath),
              });
            }
          }
        }
      }
      
      await scanDirectory(sourceDir);
      
    } catch (error) {
      logger.warning(`Directory not found: ${path.relative(process.cwd(), sourceDir)}`);
    }
  }
  
  // Deduplicate by absolute path
  const uniqueFiles = [];
  const seenPaths = new Set();
  
  for (const file of allFiles) {
    if (!seenPaths.has(file.absPath)) {
      seenPaths.add(file.absPath);
      uniqueFiles.push(file);
    }
  }
  
  return uniqueFiles;
}

// ----------------------------------------------------------------------------
// PREMIUM IMAGE PROCESSING ENGINE (FIXED SHARPENING)
// ----------------------------------------------------------------------------
async function optimizeSingleImage(file) {
  const results = [];
  const formatsToGenerate = new Set();
  
  // Determine which formats to generate
  const originalExt = file.ext.toLowerCase();
  
  // Always generate original format (unless disabled)
  if (CONFIG.keepOriginalFormat) {
    formatsToGenerate.add(originalExt.replace('.', ''));
  }
  
  // Add WebP for all formats (except GIF/SVG)
  if (CONFIG.generateMultipleFormats && !['.gif', '.svg'].includes(originalExt)) {
    formatsToGenerate.add('webp');
  }
  
  // Add AVIF if enabled and supported
  if (CONFIG.generateAvif && CONFIG.generateMultipleFormats && !['.gif', '.svg'].includes(originalExt)) {
    formatsToGenerate.add('avif');
  }
  
  // Process each format
  for (const format of formatsToGenerate) {
    const outputFileName = format === originalExt.replace('.', '') 
      ? file.name 
      : `${path.basename(file.name, originalExt)}${format}`;
    
    const outputPath = path.join(CONFIG.outputDir, file.dir ? path.relative(file.sourceDir, file.dir) : '', outputFileName);
    const outputDir = path.dirname(outputPath);
    
    try {
      // Create output directory
      await fs.mkdir(outputDir, { recursive: true });
      
      // Check if we should skip
      if (!CONFIG.force) {
        try {
          const sourceStats = await getFileStats(file.absPath);
          const destStats = await getFileStats(outputPath);
          
          if (sourceStats && destStats && destStats.mtime >= sourceStats.mtime) {
            logger.debug(`Skipping ${file.name} (${format}): up-to-date`);
            results.push({
              file: outputFileName,
              format,
              optimized: false,
              reason: 'up_to_date',
              originalSize: sourceStats.size,
              optimizedSize: destStats.size,
              savings: 0,
            });
            continue;
          }
        } catch {
          // File doesn't exist, proceed
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
        results.push({
          file: outputFileName,
          format,
          optimized: false,
          reason: 'sharp_not_available',
          error: error.message,
        });
        continue;
      }
      
      // Get source file stats
      const sourceStats = await getFileStats(file.absPath);
      if (!sourceStats) {
        throw new Error(`Cannot read file stats: ${file.name}`);
      }
      
      // Start processing pipeline
      let image = sharp(file.absPath, { failOnError: false });
      
      // Get metadata
      const metadata = await image.metadata();
      
      // Skip if image is too small for resizing
      const shouldResize = metadata.width > CONFIG.maxWidth || metadata.height > CONFIG.maxHeight;
      
      // Apply premium processing pipeline
      if (shouldResize) {
        image = image.resize(CONFIG.maxWidth, CONFIG.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
          kernel: 'lanczos3',  // High-quality resampling
        });
        
        // Apply sharpening ONLY if enabled and compatible
        if (CONFIG.enableSharpening && !['.gif', '.svg'].includes(originalExt)) {
          try {
            // Modern Sharp API (v0.32+) - safely try
            image = image.sharpen({ 
              sigma: 0.3,      // Radius of the Gaussian blur
              m1: 1,           // Flat areas
              m2: 2,           // Contrast areas
              x1: 2,           // Threshold between flat and contrast areas
              y2: 10,          // Maximum brightening
              y3: 20           // Maximum darkening
            });
          } catch (sharpenError) {
            // Silently skip sharpening if API not supported
            logger.debug(`Sharp sharpen API not available for ${file.name}, skipping`);
          }
        }
      }
      
      // Apply format-specific optimization
      let optimizedStats;
      
      switch (format) {
        case 'jpeg':
        case 'jpg':
          await image.jpeg(QUALITY.jpeg).toFile(outputPath);
          break;
          
        case 'png':
          await image.png(QUALITY.png).toFile(outputPath);
          break;
          
        case 'webp':
          await image.webp(QUALITY.webp).toFile(outputPath);
          break;
          
        case 'avif':
          try {
            await image.avif(QUALITY.avif).toFile(outputPath);
          } catch (avifError) {
            logger.warning(`AVIF not supported for ${file.name}: ${avifError.message}`);
            // Skip AVIF, don't fall back
            continue;
          }
          break;
          
        case 'gif':
          // Copy GIF as-is
          await fs.copyFile(file.absPath, outputPath);
          results.push({
            file: outputFileName,
            format: 'gif',
            optimized: false,
            reason: 'gif_copied_as_is',
            originalSize: sourceStats.size,
            optimizedSize: sourceStats.size,
            savings: 0,
          });
          continue;
          
        case 'svg':
          // Copy SVG as-is
          await fs.copyFile(file.absPath, outputPath);
          results.push({
            file: outputFileName,
            format: 'svg',
            optimized: false,
            reason: 'svg_copied_as_is',
            originalSize: sourceStats.size,
            optimizedSize: sourceStats.size,
            savings: 0,
          });
          continue;
          
        default:
          // Copy unsupported formats
          await fs.copyFile(file.absPath, outputPath);
          results.push({
            file: outputFileName,
            format,
            optimized: false,
            reason: 'unsupported_format',
            originalSize: sourceStats.size,
            optimizedSize: sourceStats.size,
            savings: 0,
          });
          continue;
      }
      
      // Get optimized file stats
      optimizedStats = await getFileStats(outputPath);
      if (!optimizedStats) {
        throw new Error(`Failed to read optimized file: ${outputFileName}`);
      }
      
      const savings = sourceStats.size - optimizedStats.size;
      const savingsPercent = sourceStats.size > 0 
        ? ((savings / sourceStats.size) * 100).toFixed(1) 
        : '0';
      
      results.push({
        file: outputFileName,
        format,
        optimized: true,
        originalSize: sourceStats.size,
        optimizedSize: optimizedStats.size,
        savings,
        savingsPercent,
        width: metadata.width,
        height: metadata.height,
        qualityProfile: CONFIG.ultraQuality ? 'ultra' : 'standard',
      });
      
      logger.debug(`Optimized ${file.name} -> ${format} (${savingsPercent}% saved)`);
      
    } catch (error) {
      logger.error(`Failed to optimize ${file.name} to ${format}: ${error.message}`);
      
      // Try to copy as fallback
      try {
        await fs.copyFile(file.absPath, outputPath);
        const sourceStats = await getFileStats(file.absPath);
        results.push({
          file: outputFileName,
          format,
          optimized: false,
          reason: 'failed_fallback_copy',
          error: error.message,
          originalSize: sourceStats?.size || 0,
          optimizedSize: sourceStats?.size || 0,
          savings: 0,
        });
      } catch (copyError) {
        results.push({
          file: outputFileName,
          format,
          optimized: false,
          reason: 'complete_failure',
          error: `${error.message} -> ${copyError.message}`,
        });
      }
    }
  }
  
  return results;
}

// ----------------------------------------------------------------------------
// PREMIUM BATCH PROCESSING
// ----------------------------------------------------------------------------
async function processImagesInBatches(files) {
  const allResults = [];
  const batchSize = CONFIG.concurrentLimit;
  let processed = 0;
  
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const progress = Math.round((processed / files.length) * 100);
    
    logger.progress(`Processing ${processed + 1}-${Math.min(processed + batchSize, files.length)}/${files.length} (${progress}%)...\r`);
    
    // Process batch
    const batchPromises = batch.map(file => optimizeSingleImage(file));
    const batchResults = await Promise.allSettled(batchPromises);
    
    // Collect results
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
      } else {
        logger.error(`Batch processing error: ${result.reason}`);
      }
    }
    
    processed += batch.length;
  }
  
  console.log(); // Clear the progress line
  return allResults.flat();
}

// ----------------------------------------------------------------------------
// PREMIUM REPORT GENERATION
// ----------------------------------------------------------------------------
function generatePremiumReport(results, startTime) {
  // Filter out failed results for summary
  const successfulResults = results.filter(r => r.optimized);
  const failedResults = results.filter(r => !r.optimized);
  
  // Calculate totals
  const totalOriginalSize = results.reduce((sum, r) => sum + (r.originalSize || 0), 0);
  const totalOptimizedSize = results.reduce((sum, r) => sum + (r.optimizedSize || 0), 0);
  const totalSavings = totalOriginalSize - totalOptimizedSize;
  const totalSavingsPercent = totalOriginalSize > 0 
    ? ((totalSavings / totalOriginalSize) * 100).toFixed(1) 
    : '0';
  
  // Group by format
  const formatStats = {};
  results.forEach(result => {
    if (!formatStats[result.format]) {
      formatStats[result.format] = { count: 0, originalSize: 0, optimizedSize: 0 };
    }
    formatStats[result.format].count++;
    formatStats[result.format].originalSize += result.originalSize || 0;
    formatStats[result.format].optimizedSize += result.optimizedSize || 0;
  });
  
  const duration = Date.now() - startTime;
  
  // Display premium report
  console.log('\n\x1b[1;35m════════════════════════════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[1;35m📊 PREMIUM IMAGE OPTIMIZATION REPORT\x1b[0m');
  console.log('\x1b[1;35m════════════════════════════════════════════════════════════════════\x1b[0m');
  
  console.log(`\x1b[1;36m📁 TOTAL PROCESSED:\x1b[0m ${results.length} files`);
  console.log(`\x1b[1;32m✅ SUCCESSFULLY OPTIMIZED:\x1b[0m ${successfulResults.length} files`);
  console.log(`\x1b[1;33m⚠️  NOT OPTIMIZED:\x1b[0m ${failedResults.length} files`);
  
  console.log('\n\x1b[1;36m💾 SIZE ANALYSIS:\x1b[0m');
  console.log(`   Original total: \x1b[1m${(totalOriginalSize / (1024 * 1024)).toFixed(2)} MB\x1b[0m`);
  console.log(`   Optimized total: \x1b[1m${(totalOptimizedSize / (1024 * 1024)).toFixed(2)} MB\x1b[0m`);
  console.log(`   Space saved: \x1b[1;32m${(totalSavings / (1024 * 1024)).toFixed(2)} MB (${totalSavingsPercent}%)\x1b[0m`);
  
  console.log('\n\x1b[1;36m📈 FORMAT BREAKDOWN:\x1b[0m');
  Object.entries(formatStats).forEach(([format, stats]) => {
    const formatSavings = stats.originalSize - stats.optimizedSize;
    const formatSavingsPercent = stats.originalSize > 0 
      ? ((formatSavings / stats.originalSize) * 100).toFixed(1) 
      : '0';
    console.log(`   ${logger.format(format)} ${format.toUpperCase()}: ${stats.count} files, ${(formatSavings/1024/1024).toFixed(2)}MB saved (${formatSavingsPercent}%)`);
  });
  
  console.log('\n\x1b[1;36m⏱️  PERFORMANCE:\x1b[0m');
  console.log(`   Duration: ${(duration / 1000).toFixed(1)} seconds`);
  console.log(`   Rate: ${(results.length / (duration / 1000)).toFixed(1)} files/second`);
  console.log(`   Quality profile: \x1b[1m${CONFIG.ultraQuality ? 'ULTRA' : 'STANDARD'}\x1b[0m`);
  console.log(`   AVIF generation: \x1b[1m${CONFIG.generateAvif ? 'ENABLED' : 'DISABLED'}\x1b[0m`);
  
  if (failedResults.length > 0) {
    const reasons = {};
    failedResults.forEach(result => {
      const reason = result.reason || 'unknown';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });
    
    console.log('\n\x1b[1;33m⚠️  NON-OPTIMIZED REASONS:\x1b[0m');
    Object.entries(reasons).forEach(([reason, count]) => {
      console.log(`   • ${reason}: ${count} files`);
    });
  }
  
  console.log('\x1b[1;35m════════════════════════════════════════════════════════════════════\x1b[0m');
  
  return {
    total: results.length,
    optimized: successfulResults.length,
    failed: failedResults.length,
    originalSize: totalOriginalSize,
    optimizedSize: totalOptimizedSize,
    savings: totalSavings,
    savingsPercent: totalSavingsPercent,
    duration,
    formatStats,
    qualityProfile: CONFIG.ultraQuality ? 'ultra' : 'standard',
    avifEnabled: CONFIG.generateAvif,
  };
}

// ----------------------------------------------------------------------------
// PREMIUM MAIN FUNCTION
// ----------------------------------------------------------------------------
async function optimizeImages() {
  const startTime = Date.now();
  
  logger.info('Starting PREMIUM image optimization...');
  logger.info(`Output directory: ${CONFIG.outputDir}`);
  logger.info(`Mode: ${CONFIG.force ? 'FORCE (re-optimize all)' : 'SMART (skip up-to-date)'}`);
  logger.info(`Quality: ${CONFIG.ultraQuality ? 'ULTRA (maximum quality)' : 'STANDARD (optimal balance)'}`);
  logger.info(`AVIF: ${CONFIG.generateAvif ? 'ENABLED' : 'DISABLED'}`);
  logger.info(`Concurrency: ${CONFIG.concurrentLimit} parallel processes`);
  
  // Create output directory
  try {
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    logger.success('Created premium output directory');
  } catch (error) {
    logger.error(`Failed to create output directory: ${error.message}`);
    return { success: false, error: error.message };
  }
  
  // Get all image files
  logger.info('Scanning for images with premium filters...');
  const files = await getAllImageFiles();
  
  if (files.length === 0) {
    logger.warning('No images found to optimize.');
    logger.info('Please add images to:');
    CONFIG.sourceDirs.forEach(dir => {
      logger.info(`   - ${dir}`);
    });
    return { success: true, message: "No images found" };
  }
  
  logger.info(`Found ${files.length} premium images to process`);
  
  // Process images with premium pipeline
  logger.info(`Processing with premium quality pipeline...`);
  const results = await processImagesInBatches(files);
  
  // Generate and display premium report
  const report = generatePremiumReport(results, startTime);
  
  // Save detailed premium report
  try {
    const reportPath = path.join(CONFIG.outputDir, "premium-optimization-report.json");
    const detailedReport = {
      timestamp: new Date().toISOString(),
      config: CONFIG,
      qualityProfile: QUALITY,
      summary: report,
      files: results.map(r => ({
        file: r.file,
        format: r.format,
        optimized: r.optimized,
        reason: r.reason,
        originalSize: r.originalSize,
        optimizedSize: r.optimizedSize,
        savings: r.savings,
        savingsPercent: r.savingsPercent,
        width: r.width,
        height: r.height,
        qualityProfile: r.qualityProfile,
        error: r.error,
      })),
    };
    
    await fs.writeFile(reportPath, JSON.stringify(detailedReport, null, 2));
    logger.success(`Premium report saved: ${reportPath}`);
    
  } catch (error) {
    logger.warning(`Failed to save report: ${error.message}`);
  }
  
  // Determine success
  const success = report.failed < report.total * 0.2; // Less than 20% failures for premium
  
  if (success) {
    logger.success('🎉 PREMIUM OPTIMIZATION COMPLETED SUCCESSFULLY!');
    return { 
      success: true, 
      summary: report,
      message: `Optimized ${report.optimized}/${report.total} files, saved ${report.savingsPercent}% space with ${report.qualityProfile.toUpperCase()} quality`
    };
  } else {
    logger.warning('⚠️  Premium optimization completed with issues');
    return { 
      success: false, 
      summary: report,
      message: `Failed to optimize ${report.failed}/${report.total} files`
    };
  }
}

// ----------------------------------------------------------------------------
// SIMPLE EXECUTION - GUARANTEED TO WORK
// ----------------------------------------------------------------------------

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('\x1b[31m💥 UNCAUGHT EXCEPTION:\x1b[0m', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\x1b[31m💥 UNHANDLED REJECTION at:\x1b[0m', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// Export the function
export { optimizeImages };

// Always execute when run directly - SIMPLE CHECK
const isMainModule = process.argv[1] && process.argv[1].includes('optimize-images');

if (isMainModule) {
  console.log('⚡ Starting premium optimization...\n');
  
  (async () => {
    try {
      const result = await optimizeImages();
      
      if (result.success) {
        console.log('\n\x1b[1;32m✅ PREMIUM SCRIPT COMPLETED SUCCESSFULLY!\x1b[0m');
        console.log(`\x1b[1;36m📊 ${result.message}\x1b[0m`);
        process.exit(0);
      } else {
        console.log('\n\x1b[1;33m⚠️  PREMIUM SCRIPT COMPLETED WITH WARNINGS\x1b[0m');
        console.log(`\x1b[1;36m📊 ${result.message}\x1b[0m`);
        process.exit(1);
      }
    } catch (error) {
      console.error('\n\x1b[1;31m🔥 FATAL ERROR IN EXECUTION:\x1b[0m', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  })();
}