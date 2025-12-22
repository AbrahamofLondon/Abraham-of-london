import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function loadContentlayer() {
  const contentlayerPath = path.join(rootDir, '.contentlayer', 'generated', 'index.mjs');
  
  if (!fs.existsSync(contentlayerPath)) {
    throw new Error('Contentlayer not built. Run pnpm run content:build first.');
  }
  
  // Convert Windows path to file:// URL for ESM import
  const contentlayerUrl = pathToFileURL(contentlayerPath).href;
  const contentlayerModule = await import(contentlayerUrl);
  return contentlayerModule.allDownloads || [];
}

function validateDownloadFile(download) {
  if (!download.downloadFile) return [];
  
  const downloadPath = download.downloadFile.replace(/^\//, '');
  const basename = path.basename(downloadPath);
  
  const possiblePaths = [
    path.join(rootDir, 'public', downloadPath),
    path.join(rootDir, 'public', 'downloads', basename),
    path.join(rootDir, 'public', 'assets', 'downloads', basename),
  ];
  
  for (const fullPath of possiblePaths) {
    if (fs.existsSync(fullPath)) {
      return [];
    }
  }
  
  return [{
    slug: download.slug,
    title: download.title,
    downloadFile: download.downloadFile,
    checkedPaths: possiblePaths,
  }];
}

async function main() {
  console.log('Validating download files...\n');
  
  const downloads = await loadContentlayer();
  console.log('Found', downloads.length, 'downloads\n');
  
  const allErrors = downloads.flatMap(validateDownloadFile);
  
  if (allErrors.length > 0) {
    console.log('❌ Missing files:\n');
    
    for (const error of allErrors) {
      console.log(' -', error.slug);
      console.log('   Title:', error.title);
      console.log('   Expected:', error.downloadFile);
      console.log('   Checked:');
      error.checkedPaths.forEach(p => console.log('    ', p));
      console.log();
    }
    
    process.exit(1);
  }
  
  console.log('✅ All files validated!\n');
}

main().catch(console.error);
