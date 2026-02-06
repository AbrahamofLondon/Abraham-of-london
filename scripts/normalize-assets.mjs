import fs from 'fs';
import path from 'path';

const DOWNLOADS_DIR = './public/downloads';
const CONTENT_DIR = './content';

function normalize() {
  console.log("--- 📁 Normalizing Asset Links (Case Correction) ---");
  
  // 1. Get real filenames from disk
  if (!fs.existsSync(DOWNLOADS_DIR)) {
    console.error("Downloads folder not found.");
    return;
  }
  const realFiles = fs.readdirSync(DOWNLOADS_DIR);
  
  // 2. Scan all content files
  const folders = ['blog', 'resources', 'insights'];
  folders.forEach(folder => {
    const fullPath = path.join(CONTENT_DIR, folder);
    if (!fs.existsSync(fullPath)) return;

    const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));

    files.forEach(file => {
      const filePath = path.join(fullPath, file);
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;

      // Match any /vault/downloads/ link
      const assetRegex = /\/vault\/downloads\/([^)]+\.pdf)/gi;

      content = content.replace(assetRegex, (match, linkedFile) => {
        // Find the actual file on disk that matches (case-insensitive search)
        const correctFile = realFiles.find(f => f.toLowerCase() === linkedFile.toLowerCase());
        
        if (correctFile && correctFile !== linkedFile) {
          console.log(`🔧 Correcting case in ${file}: ${linkedFile} -> ${correctFile}`);
          changed = true;
          return `/vault/downloads/${correctFile}`;
        }
        return match;
      });

      if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
      }
    });
  });

  console.log("✅ Asset normalization complete.");
}

normalize();