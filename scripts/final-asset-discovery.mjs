import fs from 'fs';
import path from 'path';

const DOWNLOADS_ROOT = './public/downloads';
const CONTENT_DIR = './content';

// 1. Map every PDF in every subfolder
function getActualFiles(dir, fileList = {}) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getActualFiles(filePath, fileList);
    } else if (file.endsWith('.pdf')) {
      // Store the filename (lowercase) and its relative path from /vault/
      const vaultPath = `/vault/${path.relative('./public', filePath).replace(/\\/g, '/')}`;
      fileList[file.toLowerCase()] = vaultPath;
    }
  });
  return fileList;
}

const pdfMap = getActualFiles(DOWNLOADS_ROOT);

// 2. Update content with the discovered paths
const folders = ['blog', 'resources', 'insights'];
folders.forEach(folder => {
  const fullPath = path.join(CONTENT_DIR, folder);
  if (!fs.existsSync(fullPath)) return;

  const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
  files.forEach(file => {
    const filePath = path.join(fullPath, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Look for any download link pointing to the wrong place
    content = content.replace(/\/vault\/downloads\/([^)]+\.pdf)/gi, (match, fileName) => {
      const discoveredPath = pdfMap[fileName.toLowerCase().replace(/_/g, '-') ] || pdfMap[fileName.toLowerCase()];
      
      if (discoveredPath && match !== discoveredPath) {
        console.log(`📍 Found ${fileName} at: ${discoveredPath}`);
        changed = true;
        return discoveredPath;
      }
      return match;
    });

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed paths in: ${file}`);
    }
  });
});