// scripts/optimize-fonts.js - Production Font Optimization
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Optimizing fonts for production...');

// Configuration
const CONFIG = {
  sourceDir: path.join(__dirname, '../public/fonts'),
  optimizedDir: path.join(__dirname, '../public/fonts/optimized'),
  // Fonts to optimize (Inter, Geist, etc.)
  fontConfig: {
    inter: {
      weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
      styles: ['normal', 'italic'],
      formats: ['woff2', 'ttf']
    },
    geist: {
      weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
      styles: ['normal'],
      formats: ['woff2']
    }
  }
};

// Logger
const logger = {
  info: (msg) => console.log(`📄 ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warn: (msg) => console.log(`⚠️ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`)
};

// Get font weight from filename
function extractWeightFromFilename(filename) {
  const weightMap = {
    'thin': 100,
    'extralight': 200,
    'light': 300,
    'regular': 400,
    'medium': 500,
    'semibold': 600,
    'bold': 700,
    'extrabold': 800,
    'black': 900,
    'normal': 400
  };
  
  const lowerName = filename.toLowerCase();
  for (const [key, value] of Object.entries(weightMap)) {
    if (lowerName.includes(key)) {
      return value;
    }
  }
  return 400; // Default
}

// Get font style from filename
function extractStyleFromFilename(filename) {
  const lowerName = filename.toLowerCase();
  return lowerName.includes('italic') ? 'italic' : 'normal';
}

// Get font family from filename
function extractFamilyFromFilename(filename) {
  if (filename.toLowerCase().includes('inter')) return 'Inter';
  if (filename.toLowerCase().includes('geist')) return 'Geist';
  if (filename.toLowerCase().includes('editorial')) return 'EditorialNew';
  if (filename.toLowerCase().includes('mono')) return 'GeistMono';
  return 'Unknown';
}

// Process a single font file
async function processFontFile(filePath, optimizedDir) {
  const fileName = path.basename(filePath);
  const fileExt = path.extname(filePath).toLowerCase();
  const destPath = path.join(optimizedDir, fileName);
  
  try {
    // Check if file already exists in optimized directory
    try {
      await fs.access(destPath);
      logger.warn(`Already exists: ${fileName}`);
      return { 
        name: fileName, 
        status: 'already_exists', 
        size: (await fs.stat(filePath)).size 
      };
    } catch {
      // File doesn't exist, copy it
      await fs.copyFile(filePath, destPath);
      const stats = await fs.stat(filePath);
      
      logger.success(`Copied: ${fileName} (${Math.round(stats.size / 1024)}KB)`);
      
      return {
        name: fileName,
        status: 'copied',
        size: stats.size,
        family: extractFamilyFromFilename(fileName),
        weight: extractWeightFromFilename(fileName),
        style: extractStyleFromFilename(fileName),
        format: fileExt.replace('.', '')
      };
    }
  } catch (error) {
    logger.error(`Failed to process ${fileName}: ${error.message}`);
    return { 
      name: fileName, 
      status: 'failed', 
      error: error.message 
    };
  }
}

// Scan directory for font files
async function scanFontsDirectory(directory) {
  const fontFiles = [];
  
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.ttf', '.woff', '.woff2', '.otf', '.eot'].includes(ext)) {
          fontFiles.push({
            name: entry.name,
            path: path.join(directory, entry.name),
            ext: ext
          });
        }
      }
    }
    
    logger.info(`Found ${fontFiles.length} font files in ${path.relative(process.cwd(), directory)}`);
    
  } catch (error) {
    logger.warn(`Could not scan directory ${directory}: ${error.message}`);
  }
  
  return fontFiles;
}

// Create manifest
async function createManifest(optimizedDir, processedFonts) {
  const manifest = {
    generated: new Date().toISOString(),
    fonts: {
      byFamily: {},
      byFormat: {},
      stats: {
        total: processedFonts.length,
        copied: processedFonts.filter(f => f.status === 'copied').length,
        alreadyExists: processedFonts.filter(f => f.status === 'already_exists').length,
        failed: processedFonts.filter(f => f.status === 'failed').length,
        totalSize: processedFonts.reduce((sum, f) => sum + (f.size || 0), 0)
      }
    }
  };
  
  // Organize fonts by family
  processedFonts.forEach(font => {
    if (font.family) {
      if (!manifest.fonts.byFamily[font.family]) {
        manifest.fonts.byFamily[font.family] = {
          variants: [],
          totalSize: 0
        };
      }
      
      manifest.fonts.byFamily[font.family].variants.push({
        name: font.name,
        weight: font.weight,
        style: font.style,
        format: font.format,
        size: font.size,
        status: font.status
      });
      
      manifest.fonts.byFamily[font.family].totalSize += font.size || 0;
    }
    
    // Organize by format
    if (font.format) {
      if (!manifest.fonts.byFormat[font.format]) {
        manifest.fonts.byFormat[font.format] = {
          count: 0,
          totalSize: 0
        };
      }
      
      manifest.fonts.byFormat[font.format].count++;
      manifest.fonts.byFormat[font.format].totalSize += font.size || 0;
    }
  });
  
  // Save manifest
  const manifestPath = path.join(optimizedDir, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  
  return manifest;
}

// Main function
async function main() {
  const startTime = Date.now();
  
  logger.info('🚀 Starting font optimization');
  logger.info(`Source: ${CONFIG.sourceDir}`);
  logger.info(`Output: ${CONFIG.optimizedDir}`);
  
  try {
    // Check if source directory exists
    try {
      await fs.access(CONFIG.sourceDir);
    } catch {
      logger.warn(`Source directory not found: ${CONFIG.sourceDir}`);
      logger.info('Creating source directory...');
      await fs.mkdir(CONFIG.sourceDir, { recursive: true });
    }
    
    // Create optimized directory
    await fs.mkdir(CONFIG.optimizedDir, { recursive: true });
    logger.success(`Created output directory: ${CONFIG.optimizedDir}`);
    
    // Scan for fonts
    const fontFiles = await scanFontsDirectory(CONFIG.sourceDir);
    
    if (fontFiles.length === 0) {
      logger.warn('No font files found to optimize');
      
      // Create empty manifest
      const manifest = {
        generated: new Date().toISOString(),
        note: 'No fonts found to optimize',
        sourceDir: CONFIG.sourceDir,
        optimizedDir: CONFIG.optimizedDir
      };
      
      const manifestPath = path.join(CONFIG.optimizedDir, 'manifest.json');
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      
      logger.info(`Empty manifest created: ${manifestPath}`);
      return;
    }
    
    // Process fonts in parallel (limited concurrency)
    const processedFonts = [];
    const batchSize = 5;
    
    for (let i = 0; i < fontFiles.length; i += batchSize) {
      const batch = fontFiles.slice(i, i + batchSize);
      const batchPromises = batch.map(file => 
        processFontFile(file.path, CONFIG.optimizedDir)
      );
      
      const batchResults = await Promise.all(batchPromises);
      processedFonts.push(...batchResults);
      
      // Progress indicator
      const progress = Math.round(((i + batch.length) / fontFiles.length) * 100);
      process.stdout.write(`⏳ Processing: ${progress}% (${i + batch.length}/${fontFiles.length})\r`);
    }
    
    console.log(); // New line after progress
    
    // Create manifest
    const manifest = await createManifest(CONFIG.optimizedDir, processedFonts);
    
    // Generate summary
    const duration = Date.now() - startTime;
    const copiedCount = processedFonts.filter(f => f.status === 'copied').length;
    const totalSizeMB = (manifest.fonts.stats.totalSize / (1024 * 1024)).toFixed(2);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 FONT OPTIMIZATION COMPLETE');
    console.log('='.repeat(50));
    console.log(`📊 Summary:`);
    console.log(`  Total fonts found: ${fontFiles.length}`);
    console.log(`  Newly copied: ${copiedCount}`);
    console.log(`  Already existed: ${manifest.fonts.stats.alreadyExists}`);
    console.log(`  Failed: ${manifest.fonts.stats.failed}`);
    console.log(`  Total size: ${totalSizeMB} MB`);
    console.log(`  Duration: ${duration}ms`);
    console.log('='.repeat(50));
    
    // Show font families
    const families = Object.keys(manifest.fonts.byFamily);
    if (families.length > 0) {
      console.log('\n📋 Font families:');
      families.forEach(family => {
        const familyData = manifest.fonts.byFamily[family];
        const variantCount = familyData.variants.length;
        const sizeMB = (familyData.totalSize / (1024 * 1024)).toFixed(2);
        console.log(`  • ${family}: ${variantCount} variants (${sizeMB} MB)`);
      });
    }
    
    console.log('='.repeat(50));
    console.log(`📋 Manifest: ${path.join(CONFIG.optimizedDir, 'manifest.json')}`);
    
    // Exit with appropriate code
    if (manifest.fonts.stats.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
    
  } catch (error) {
    logger.error(`Font optimization failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main().catch(error => {
    logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

export { main as optimizeFonts };
