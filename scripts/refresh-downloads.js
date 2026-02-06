// scripts/refresh-downloads.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the PDF registry
import { ALL_SOURCE_PDFS } from './pdf/pdf-registry.source.js';

/**
 * Refresh downloads index with real assets only
 */
async function refreshDownloads() {
  console.log(chalk.blue('🔄 Refreshing downloads index with real assets...\n'));
  
  // First, clean up any placeholders
  console.log(chalk.cyan('Step 1: Checking for placeholder PDFs...'));
  await cleanPlaceholders();
  
  console.log(chalk.cyan('\nStep 2: Indexing real PDF assets...'));
  
  const downloadsDir = path.join(process.cwd(), 'public', 'assets', 'downloads');
  const contentDownloadsDir = path.join(downloadsDir, 'content-downloads');
  const libPdfDir = path.join(downloadsDir, 'lib-pdf');
  const resourcesDir = path.join(process.cwd(), 'public', 'assets', 'downloads', 'public-assets', 'resources', 'pdfs');
  
  // Create a map of expected PDFs from registry
  const registryMap = new Map();
  ALL_SOURCE_PDFS.forEach(pdf => {
    const fullPath = path.join(process.cwd(), 'public', pdf.outputPath.replace(/^\//, ''));
    registryMap.set(fullPath, pdf);
  });
  
  // Collect all real PDF files
  const realPDFFiles = [];
  const missingPDFs = [];
  
  // Helper function to collect PDFs from a directory
  function collectRealPDFs(dir, basePath = '') {
    if (!fs.existsSync(dir)) {
      console.log(chalk.yellow(`⚠️  Directory does not exist: ${dir}`));
      return;
    }
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      const relativePath = path.join(basePath, file.name);
      
      if (file.isDirectory()) {
        collectRealPDFs(fullPath, relativePath);
      } else if (file.name.toLowerCase().endsWith('.pdf')) {
        // Check if this is a real PDF (not placeholder)
        try {
          const fileBuffer = fs.readFileSync(fullPath);
          const fileContent = fileBuffer.toString('utf8', 0, Math.min(1024, fileBuffer.length));
          
          // Skip placeholders
          const isPlaceholder = 
            fileContent.includes('PLACEHOLDER') ||
            fileContent.includes('Generated:') && fileContent.includes('Abraham of London - Digital Assets System') ||
            fileContent.includes('This is a placeholder');
          
          if (!isPlaceholder && fileBuffer.length > 1024) {
            const stats = fs.statSync(fullPath);
            const webPath = `/assets/downloads/${relativePath}`.replace(/\\/g, '/');
            
            realPDFFiles.push({
              name: file.name,
              path: relativePath,
              webPath: webPath,
              size: stats.size,
              modified: stats.mtime,
              directory: basePath || 'root',
              fullPath: fullPath
            });
            
            // Check if this PDF is in our registry
            if (!registryMap.has(fullPath)) {
              console.log(chalk.yellow(`  ⚠️  PDF not in registry: ${relativePath}`));
            }
          }
        } catch (error) {
          console.error(chalk.red(`  ❌ Error reading ${file.name}:`), error.message);
        }
      }
    }
  }
  
  // Collect from all directories
  console.log(chalk.gray('Scanning for real PDF files...'));
  collectRealPDFs(downloadsDir);
  collectRealPDFs(contentDownloadsDir, 'content-downloads');
  collectRealPDFs(libPdfDir, 'lib-pdf');
  collectRealPDFs(resourcesDir, 'public-assets/resources/pdfs');
  
  console.log(chalk.green(`Found ${realPDFFiles.length} real PDF files\n`));
  
  // Check registry against found files
  console.log(chalk.cyan('Step 3: Validating registry against real files...'));
  ALL_SOURCE_PDFS.forEach(pdf => {
    const expectedPath = path.join(process.cwd(), 'public', pdf.outputPath.replace(/^\//, ''));
    
    if (!fs.existsSync(expectedPath)) {
      console.log(chalk.red(`  ❌ Missing from filesystem: ${pdf.title}`));
      missingPDFs.push(pdf);
    }
  });
  
  if (missingPDFs.length > 0) {
    console.log(chalk.red(`\n⚠️  ${missingPDFs.length} PDFs from registry are missing:`));
    missingPDFs.forEach(pdf => {
      console.log(chalk.red(`    • ${pdf.title} -> ${pdf.outputPath}`));
    });
  }
  
  // Sort by modified date (newest first)
  realPDFFiles.sort((a, b) => b.modified.getTime() - a.modified.getTime());
  
  // Generate downloads index
  const indexData = {
    generated: new Date().toISOString(),
    count: realPDFFiles.length,
    totalSize: realPDFFiles.reduce((sum, file) => sum + file.size, 0),
    files: realPDFFiles.map(file => ({
      name: file.name,
      path: file.webPath,
      size: file.size,
      sizeFormatted: formatBytes(file.size),
      modified: file.modified.toISOString(),
      directory: file.directory
    })),
    missingFromRegistry: missingPDFs.length,
    missingEntries: missingPDFs.map(pdf => ({
      id: pdf.id,
      title: pdf.title,
      expectedPath: pdf.outputPath
    }))
  };
  
  // Write index file
  const indexPath = path.join(process.cwd(), 'public', 'assets', 'downloads', 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
  
  console.log(chalk.green(`✅ Created downloads index at: ${indexPath}`));
  
  // Generate statistics
  const stats = {
    byDirectory: {},
    totalSize: indexData.totalSize,
    count: indexData.count,
    missingCount: missingPDFs.length
  };
  
  realPDFFiles.forEach(file => {
    if (!stats.byDirectory[file.directory]) {
      stats.byDirectory[file.directory] = {
        count: 0,
        size: 0
      };
    }
    stats.byDirectory[file.directory].count++;
    stats.byDirectory[file.directory].size += file.size;
  });
  
  // Write stats file
  const statsPath = path.join(process.cwd(), 'public', 'assets', 'downloads', 'stats.json');
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  
  console.log(chalk.green(`✅ Created download statistics at: ${statsPath}\n`));
  
  // Print summary
  console.log(chalk.cyan('📊 Downloads Summary:'));
  console.log(chalk.gray('─'.repeat(40)));
  
  Object.entries(stats.byDirectory).forEach(([dir, data]) => {
    const percentage = ((data.count / stats.count) * 100).toFixed(1);
    console.log(chalk.white(`  ${dir || '/'}`));
    console.log(chalk.gray(`    📄 ${data.count} files (${percentage}%)`));
    console.log(chalk.gray(`    📦 ${formatBytes(data.size)}`));
  });
  
  console.log(chalk.gray('─'.repeat(40)));
  console.log(chalk.white(`  Total: ${stats.count} files, ${formatBytes(stats.totalSize)}`));
  
  if (missingPDFs.length > 0) {
    console.log(chalk.red(`  Missing: ${missingPDFs.length} files from registry`));
  }
  
  console.log(chalk.green('\n✅ Downloads index refreshed successfully!'));
}

/**
 * Clean up placeholder PDFs
 */
async function cleanPlaceholders() {
  const directories = [
    path.join(process.cwd(), 'public', 'assets', 'downloads'),
    path.join(process.cwd(), 'public', 'assets', 'downloads', 'content-downloads'),
    path.join(process.cwd(), 'public', 'assets', 'downloads', 'lib-pdf'),
    path.join(process.cwd(), 'public', 'assets', 'downloads', 'public-assets', 'resources', 'pdfs')
  ];
  
  let cleanedCount = 0;
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) continue;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      if (file.isFile() && file.name.toLowerCase().endsWith('.pdf')) {
        const filePath = path.join(dir, file.name);
        
        try {
          const fileBuffer = fs.readFileSync(filePath);
          const fileContent = fileBuffer.toString('utf8', 0, Math.min(1024, fileBuffer.length));
          
          const isPlaceholder = 
            fileContent.includes('PLACEHOLDER') ||
            fileContent.includes('Generated:') && fileContent.includes('Abraham of London - Digital Assets System') ||
            fileContent.includes('This is a placeholder') ||
            fileBuffer.length < 1024;
          
          if (isPlaceholder) {
            console.log(chalk.gray(`    🗑️  ${file.name}`));
            fs.unlinkSync(filePath);
            cleanedCount++;
          }
        } catch (error) {
          // Skip error
        }
      }
    }
  }
  
  if (cleanedCount > 0) {
    console.log(chalk.yellow(`  Cleared ${cleanedCount} placeholder PDFs`));
  }
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Main function
 */
async function main() {
  try {
    console.log(chalk.blue.bold('🔄 Abraham of London - Downloads Refresh (Real Assets Only)'));
    console.log(chalk.gray('Version: 2.0.0\n'));
    
    await refreshDownloads();
    
  } catch (error) {
    console.error(chalk.red.bold('\n💥 Error refreshing downloads:'), error);
    process.exit(1);
  }
}

// Run the main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(chalk.red('Unhandled error:'), error);
    process.exit(1);
  });
}

export { refreshDownloads };