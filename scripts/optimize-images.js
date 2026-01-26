// scripts/optimize-images.js - FIXED VERSION
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);  // CORRECT VARIABLE NAME
const execAsync = promisify(exec);

// Configuration - FIXED all __dirname references
const CONFIG = {
  sourceDirs: [
    path.join(__dirname, '../public/images'),
    path.join(__dirname, '../public/assets/images'),
    path.join(__dirname, '../public/assets'),  // FIXED HERE
    path.join(__dirname, '../public')
  ],
  
  outputDir: path.join(__dirname, '../public/optimized-images'),
  outputDir: path.join(__dirname, '../public/optimized-images'),
  
  // File extensions to process
  extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  
  // Optimization settings
  optimization: {
    jpeg: { quality: 85, progressive: true },
    png: { quality: 85, compressionLevel: 6 },
    webp: { quality: 85 },
    maxWidth: 1920, // Max width for resizing
    maxHeight: 1080 // Max height for resizing
  },
  
  // Skip files larger than (bytes)
  maxFileSize: 10 * 1024 * 1024, // 10MB
  
  // Parallel processing
  concurrentLimit: 4
};

// Logger with colors
const logger = {
  info: (msg) => console.log(`📸 ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  progress: (msg) => process.stdout.write(`⏳ ${msg}`)
};

// Check if Sharp is available
async function checkSharpAvailability() {
  try {
    await import('sharp');
    logger.success('Sharp module available for image processing');
    return true;
  } catch (error) {
    logger.warning('Sharp not available, using alternative methods');
    return false;
  }
}

// Get image files recursively
async function getImageFiles(directory, extensions) {
  const files = [];
  
  async function scanDir(currentPath) {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            files.push({
              path: fullPath,
              name: entry.name,
              extension: ext,
              relativePath: path.relative(process.cwd(), fullPath)
            });
          }
        }
      }
    } catch (error) {
      logger.warning(`Cannot scan ${currentPath}: ${error.message}`);
    }
  }
  
  await scanDir(directory);
  return files;
}

// Get file statistics
async function getFileStats(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };
  } catch (error) {
    return null;
  }
}

// Optimize image using Sharp (if available)
async function optimizeImageWithSharp(sourcePath, outputPath, config) {
  try {
    const sharp = (await import('sharp')).default;
    const stats = await getFileStats(sourcePath);
    
    if (!stats || stats.size > config.maxFileSize) {
      logger.warning(`Skipping large file: ${path.basename(sourcePath)} (${Math.round(stats.size / 1024)}KB)`);
      return { optimized: false, reason: 'file_too_large', originalSize: stats.size };
    }
    
    let image = sharp(sourcePath);
    const metadata = await image.metadata();
    
    // Resize if necessary
    if (metadata.width > config.maxWidth || metadata.height > config.maxHeight) {
      image = image.resize(config.maxWidth, config.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    // Apply optimization based on format
    const ext = path.extname(sourcePath).toLowerCase();
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        await image.jpeg(config.optimization.jpeg).toFile(outputPath);
        break;
      case '.png':
        await image.png(config.optimization.png).toFile(outputPath);
        break;
      case '.webp':
        await image.webp(config.optimization.webp).toFile(outputPath);
        break;
      case '.gif':
        // For GIFs, we might want to convert to MP4 or keep as is
        await fs.copyFile(sourcePath, outputPath);
        break;
      default:
        await fs.copyFile(sourcePath, outputPath);
    }
    
    const optimizedStats = await getFileStats(outputPath);
    const savings = stats.size - optimizedStats.size;
    const savingsPercent = ((savings / stats.size) * 100).toFixed(1);
    
    return {
      optimized: true,
      originalSize: stats.size,
      optimizedSize: optimizedStats.size,
      savings: savings,
      savingsPercent: savingsPercent,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format
    };
    
  } catch (error) {
    logger.error(`Sharp optimization failed for ${path.basename(sourcePath)}: ${error.message}`);
    return { optimized: false, reason: 'optimization_failed', error: error.message };
  }
}

// Optimize image using ImageMagick (fallback)
async function optimizeImageWithImageMagick(sourcePath, outputPath, config) {
  try {
    const stats = await getFileStats(sourcePath);
    
    if (!stats || stats.size > config.maxFileSize) {
      return { optimized: false, reason: 'file_too_large' };
    }
    
    const ext = path.extname(sourcePath).toLowerCase();
    let command;
    
    if (ext === '.jpg' || ext === '.jpeg') {
      command = `magick "${sourcePath}" -strip -quality ${config.optimization.jpeg.quality} -interlace Plane "${outputPath}"`;
    } else if (ext === '.png') {
      command = `magick "${sourcePath}" -strip -quality ${config.optimization.png.quality} "${outputPath}"`;
    } else {
      // Just copy for unsupported formats
      await fs.copyFile(sourcePath, outputPath);
      return { optimized: false, reason: 'format_not_supported' };
    }
    
    await execAsync(command);
    const optimizedStats = await getFileStats(outputPath);
    
    return {
      optimized: true,
      originalSize: stats.size,
      optimizedSize: optimizedStats.size,
      savings: stats.size - optimizedStats.size
    };
    
  } catch (error) {
    logger.warning(`ImageMagick not available or failed: ${error.message}`);
    return { optimized: false, reason: 'imagemagick_unavailable' };
  }
}

// Simple copy if no optimization is available
async function copyImage(sourcePath, outputPath) {
  await fs.copyFile(sourcePath, outputPath);
  const stats = await getFileStats(sourcePath);
  return {
    optimized: false,
    originalSize: stats.size,
    optimizedSize: stats.size,
    savings: 0,
    reason: 'no_optimization_tool'
  };
}

// Process a single image file
async function processImage(file, outputBaseDir, useSharp) {
  const relativeDir = path.dirname(file.relativePath);
  const outputDir = path.join(outputBaseDir, relativeDir);
  const outputPath = path.join(outputDir, file.name);
  
  // Create output directory if it doesn't exist
  await fs.mkdir(outputDir, { recursive: true });
  
  let result;
  
  if (useSharp) {
    result = await optimizeImageWithSharp(file.path, outputPath, CONFIG.optimization);
  } else {
    // Try ImageMagick, fall back to copy
    result = await optimizeImageWithImageMagick(file.path, outputPath, CONFIG.optimization);
    if (!result.optimized) {
      result = await copyImage(file.path, outputPath);
    }
  }
  
  return {
    file: file.name,
    path: file.relativePath,
    ...result
  };
}

// Process images in batches
async function processImagesInBatches(files, outputBaseDir, useSharp, batchSize = CONFIG.concurrentLimit) {
  const results = [];
  
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    logger.progress(`Processing ${i + 1}-${Math.min(i + batchSize, files.length)}/${files.length}\r`);
    
    const batchPromises = batch.map(file => 
      processImage(file, outputBaseDir, useSharp)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  console.log(); // New line after progress
  return results;
}

// Generate optimization report
function generateReport(results, startTime) {
  const optimized = results.filter(r => r.optimized);
  const failed = results.filter(r => !r.optimized);
  
  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalOptimizedSize = results.reduce((sum, r) => sum + (r.optimizedSize || 0), 0);
  const totalSavings = totalOriginalSize - totalOptimizedSize;
  const totalSavingsPercent = totalOriginalSize > 0 ? ((totalSavings / totalOriginalSize) * 100).toFixed(1) : 0;
  
  const duration = Date.now() - startTime;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMAGE OPTIMIZATION REPORT');
  console.log('='.repeat(60));
  
  console.log(`📁 Total images processed: ${results.length}`);
  console.log(`✅ Successfully optimized: ${optimized.length}`);
  console.log(`⚠️  Not optimized: ${failed.length}`);
  
  console.log(`\n💾 Size reduction:`);
  console.log(`   Original: ${(totalOriginalSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   Optimized: ${(totalOptimizedSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   Savings: ${(totalSavings / (1024 * 1024)).toFixed(2)} MB (${totalSavingsPercent}%)`);
  
  console.log(`\n⏱️  Duration: ${(duration / 1000).toFixed(1)} seconds`);
  console.log(`📁 Output: ${CONFIG.outputDir}`);
  
  if (failed.length > 0) {
    console.log(`\n⚠️  Files not optimized:`);
    const reasons = failed.reduce((acc, r) => {
      acc[r.reason] = (acc[r.reason] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(reasons).forEach(([reason, count]) => {
      console.log(`   • ${reason}: ${count} files`);
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
    duration
  };
}

// Main function
async function main() {
  const startTime = Date.now();
  
  logger.info('🚀 Starting production image optimization');
  logger.info(`Output directory: ${CONFIG.outputDir}`);
  
  // Check for optimization tools
  const useSharp = await checkSharpAvailability();
  
  // Create output directory
  await fs.mkdir(CONFIG.outputDir, { recursive: true });
  
  // Collect all image files
  let allFiles = [];
  
  for (const dir of CONFIG.sourceDirs) {
    try {
      await fs.access(dir);
      const files = await getImageFiles(dir, CONFIG.extensions);
      allFiles.push(...files);
      logger.info(`Found ${files.length} images in ${path.relative(process.cwd(), dir)}`);
    } catch (error) {
      logger.warning(`Directory not found or inaccessible: ${dir}`);
    }
  }
  
  if (allFiles.length === 0) {
    logger.warning('No images found to optimize');
    return;
  }
  
  logger.info(`Total images to process: ${allFiles.length}`);
  
  // Process images
  const results = await processImagesInBatches(allFiles, CONFIG.outputDir, useSharp);
  
  // Generate and save report
  const report = generateReport(results, startTime);
  
  // Save detailed report
  const reportPath = path.join(CONFIG.outputDir, 'optimization-report.json');
  await fs.writeFile(
    reportPath,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      config: CONFIG,
      summary: report,
      files: results.map(r => ({
        file: r.file,
        path: r.path,
        optimized: r.optimized,
        originalSize: r.originalSize,
        optimizedSize: r.optimizedSize,
        savings: r.savings,
        reason: r.reason
      }))
    }, null, 2)
  );
  
  logger.success(`Detailed report saved: ${reportPath}`);
  
  // Exit with appropriate code
  if (report.failed > report.total * 0.5) {
    // More than 50% failed
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main().catch(error => {
    logger.error(`Fatal error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  });
}

export { main as optimizeImages };


