// scripts/pdf/generate-pdfs.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the PDF registry
const { ALL_SOURCE_PDFS } = await import('./pdf-registry.source.js');

/**
 * Validate that all required PDFs exist and are not placeholders
 */
async function validatePDFAssets(): Promise<void> {
  console.log(chalk.blue('🔍 Validating PDF assets from registry...'));
  console.log(chalk.gray(`Found ${ALL_SOURCE_PDFS.length} PDF definitions in registry\n`));
  
  let missingCount = 0;
  let placeholderCount = 0;
  let validCount = 0;
  
  for (const [index, pdfItem] of ALL_SOURCE_PDFS.entries()) {
    try {
      const outputPath = path.join(process.cwd(), 'public', pdfItem.outputPath.replace(/^\//, ''));
      
      console.log(chalk.cyan(`[${index + 1}/${ALL_SOURCE_PDFS.length}] Checking: ${pdfItem.title}`));
      console.log(chalk.gray(`  Expected at: ${pdfItem.outputPath}`));
      
      // Check if PDF exists
      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        const fileSizeKB = Math.round(stats.size / 1024);
        
        if (fileSizeKB > 0) {
          // Check if it's not a placeholder (read first few bytes)
          const fileBuffer = fs.readFileSync(outputPath);
          const fileContent = fileBuffer.toString('utf8', 0, Math.min(1024, fileBuffer.length));
          
          const isPlaceholder = 
            fileContent.includes('PLACEHOLDER') ||
            fileContent.includes('Generated:') && fileContent.includes('Abraham of London - Digital Assets System') ||
            fileContent.includes('This is a placeholder');
          
          if (isPlaceholder) {
            console.log(chalk.yellow(`  ⚠️  Found placeholder (${fileSizeKB}KB) - needs replacement`));
            placeholderCount++;
          } else {
            console.log(chalk.green(`  ✅ Valid asset found (${fileSizeKB}KB)`));
            validCount++;
          }
        } else {
          console.log(chalk.yellow(`  ⚠️  Empty file (0KB)`));
          missingCount++;
        }
      } else {
        console.log(chalk.red(`  ❌ Missing - needs to be created`));
        missingCount++;
      }
      
    } catch (error) {
      console.error(chalk.red(`  ❌ Error checking PDF "${pdfItem.title}":`), error instanceof Error ? error.message : String(error));
      missingCount++;
    }
    
    console.log(); // Add spacing between items
  }
  
  // Print summary
  console.log(chalk.cyan('\n' + '═'.repeat(50)));
  console.log(chalk.bold('📊 Asset Validation Summary:'));
  console.log(chalk.green(`  ✅ Valid assets: ${validCount}`));
  console.log(chalk.yellow(`  ⚠️  Placeholders: ${placeholderCount}`));
  console.log(chalk.red(`  ❌ Missing: ${missingCount}`));
  console.log(chalk.blue(`  📄 Total expected: ${ALL_SOURCE_PDFS.length}`));
  console.log(chalk.cyan('═'.repeat(50)));
  
  if (missingCount > 0) {
    console.log(chalk.red.bold('\n💥 Some required PDFs are missing. Build failed.'));
    process.exit(1);
  }
  
  if (placeholderCount > 0) {
    console.log(chalk.yellow.bold('\n⚠️  Some PDFs are still placeholders. Run clean-placeholders first.'));
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    console.log(chalk.blue.bold('🔄 Abraham of London - PDF Asset Validator'));
    console.log(chalk.gray('Version: 1.0.0\n'));
    
    await validatePDFAssets();
    
    console.log(chalk.green.bold('\n🎉 PDF asset validation completed!'));
    
  } catch (error) {
    console.error(chalk.red.bold('\n💥 Fatal error in PDF validation:'), error);
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

export { validatePDFAssets };