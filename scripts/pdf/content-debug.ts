import fs from 'fs';
import path from 'path';

const SOURCES = ['./content/downloads', './lib/pdf'];

console.log('🔍 Starting Abraham of London Source Content Audit...');

SOURCES.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️ Folder not found: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir, { recursive: true }) as string[];
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) return;

    const stats = fs.statSync(fullPath);
    const ext = path.extname(file).toLowerCase();
    
    // Check for empty source files
    if (stats.size < 10) {
      console.error(`❌ EMPTY SOURCE: ${fullPath} (${stats.size} bytes)`);
    } else if (['.md', '.mdx'].includes(ext)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (!content.trim()) {
        console.error(`❌ BLANK TEXT: ${fullPath}`);
      }
    } else {
      console.log(`✅ Validated: ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
    }
  });
});