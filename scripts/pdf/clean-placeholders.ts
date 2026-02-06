// scripts/pdf/clean-placeholders.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Clean up placeholder PDFs by deleting any PDF that contains "PLACEHOLDER" in its content
 */
async function cleanPlaceholderPDFs(): Promise<void> {
  console.log(chalk.blue('🧹 Cleaning up placeholder PDFs...\n'));
  
  // Directories to scan
  const directories = [
    path.join(process.cwd(), 'public', 'assets', 'downloads'),
    path.join(process.cwd(), 'public', 'assets', 'downloads', 'content-downloads'),
    path.join(process.cwd(), 'public', 'assets', 'downloads', 'lib-pdf'),
    path.join(process.cwd(), 'public', 'assets', 'downloads', 'public-assets', 'resources', 'pdfs')
  ];
  
  let cleanedCount = 0;
  let keptCount = 0;
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(chalk.yellow(`⚠️  Directory does not exist: ${dir}`));
      continue;
    }
    
    console.log(chalk.cyan(`Scanning directory: ${path.relative(process.cwd(), dir)}`));
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      if (file.isFile() && file.name.toLowerCase().endsWith('.pdf')) {
        const filePath = path.join(dir, file.name);
        
        try {
          // Read the first 1024 bytes to check for placeholder markers
          const fileBuffer = fs.readFileSync(filePath);
          const fileContent = fileBuffer.toString('utf8', 0, Math.min(1024, fileBuffer.length));
          
          // Check for common placeholder indicators
          const isPlaceholder = 
            fileContent.includes('PLACEHOLDER') ||
            fileContent.includes('Generated:') && fileContent.includes('Abraham of London - Digital Assets System') ||
            fileContent.includes('This is a placeholder') ||
            fileBuffer.length < 1024; // Very small files are likely placeholders
          
          if (isPlaceholder) {
            console.log(chalk.yellow(`  🗑️  Deleting placeholder: ${file.name} (${Math.round(fileBuffer.length / 1024)}KB)`));
            fs.unlinkSync(filePath);
            cleanedCount++;
          } else {
            console.log(chalk.gray(`  ✓ Keeping: ${file.name} (${Math.round(fileBuffer.length / 1024)}KB)`));
            keptCount++;
          }
        } catch (error) {
          console.error(chalk.red(`  ❌ Error processing ${file.name}:`), error.message);
        }
      }
    }
  }
  
  console.log(chalk.cyan('\n' + '═'.repeat(50)));
  console.log(chalk.bold('📊 Cleanup Summary:'));
  console.log(chalk.green(`  ✅ Kept: ${keptCount} real PDFs`));
  console.log(chalk.yellow(`  🗑️  Deleted: ${cleanedCount} placeholder PDFs`));
  console.log(chalk.cyan('═'.repeat(50)));
  
  console.log(chalk.green.bold('\n🎉 Placeholder cleanup completed!'));
}