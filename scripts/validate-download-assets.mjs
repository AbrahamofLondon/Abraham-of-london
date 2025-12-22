// scripts/validate-downloads.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function loadContentlayer() {
  const contentlayerPath = path.join(rootDir, '.contentlayer', 'generated', 'index.mjs');
  
  if (!fs.existsSync(contentlayerPath)) {
    throw new Error(
      `Contentlayer output not found at ${contentlayerPath}. Run "pnpm run content:build" before downloads:validate.`
    );
  }
  
  const contentlayerModule = await import(contentlayerPath);
  return contentlayerModule.allDownloads || [];
}

function validateDownloadFile(download) {
  const errors = [];
  
  if (!download.downloadFile) {
    return errors;
  }
  
  // Remove leading slash
  const downloadPath = download.downloadFile.replace(/^\//, '');
  const basename = path.basename(downloadPath);
  
  // Try multiple possible locations
  const possiblePaths = [
    path.join(rootDir, 'public', downloadPath), // Full path as specified
    path.join(rootDir, 'public/downloads', basename), // Legacy
    path.join(rootDir, 'public/assets/downloads', basename), // Current standard
  ];
  
  let found = false;
  
  for (const fullPath of possiblePaths) {
    if (fs.existsSync(fullPath)) {
      found = true;
      break;
    }
  }
  
  if (!found) {
    errors.push({
      slug: download.slug,
      title: download.title,
      downloadFile: download.downloadFile,
      checkedPaths: possiblePaths,
    });
  }
  
  return errors;
}

async function main() {
  console.log('Validating download files...\n');
  
  try {
    const downloads = await loadContentlayer();
    console.log(`Found ${downloads.length} downloads to validate\n`);
    
    const allErrors = [];
    
    for (const download of downloads) {
      const errors = validateDownloadFile(download);
      allErrors.push(...errors);
    }
    
    if (allErrors.length > 0) {
      console.log('❌ Download validation failed.\n');
      console.log('Missing files:\n');
      
      for (const error of allErrors) {
        console.log(` - ${error.slug}`);
        console.log(`   Title: "${error.title}"`);
        console.log(`   Expected: ${error.downloadFile}`);
        console.log(`   Checked:`);
        error.checkedPaths.forEach(p => console.log(`     - ${p}`));
        console.log();
      }
      
      process.exit(1);
    }
    
    console.log('✅ All download files validated successfully!\n');
    
  } catch (error) {
    console.error('Error while validating downloads:', error);
    process.exit(1);
  }
}

main();