// scripts/ensure-href-field.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentDir = path.join(__dirname, '..', 'content');
const downloadFile = 'downloads/ultimate-purpose-of-man-editorial.mdx';

async function ensureHrefField() {
  const filePath = path.join(contentDir, downloadFile);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if href field already exists
    if (content.includes('\nhref:')) {
      console.log('✅ href field already exists in:', downloadFile);
      return;
    }
    
    // Find the downloadUrl line
    const lines = content.split('\n');
    let newContent = '';
    let hrefAdded = false;
    
    for (let i = 0; i < lines.length; i++) {
      newContent += lines[i] + '\n';
      
      // After we find downloadUrl, add href
      if (lines[i].trim().startsWith('downloadUrl:')) {
        const hrefLine = lines[i].replace('downloadUrl', 'href');
        newContent += hrefLine + '\n';
        hrefAdded = true;
        console.log('📝 Added href field matching downloadUrl');
      }
    }
    
    if (hrefAdded) {
      // Backup original file
      const backupPath = filePath + '.backup-' + Date.now();
      fs.writeFileSync(backupPath, content);
      console.log('💾 Created backup at:', backupPath);
      
      // Write updated file
      fs.writeFileSync(filePath, newContent.trim());
      console.log('✅ Updated file successfully');
    } else {
      console.log('⚠️ Could not find downloadUrl field to use as reference');
      
      // Alternative: add href after file field
      const altContent = content.replace(
        'file: /assets/downloads/ultimate-purpose-of-man-editorial.pdf',
        'file: /assets/downloads/ultimate-purpose-of-man-editorial.pdf\nhref: /assets/downloads/ultimate-purpose-of-man-editorial.pdf'
      );
      
      if (altContent !== content) {
        const backupPath = filePath + '.backup-' + Date.now();
        fs.writeFileSync(backupPath, content);
        fs.writeFileSync(filePath, altContent);
        console.log('✅ Added href field after file field');
      }
    }
    
  } catch (error) {
    console.error('❌ Error updating file:', error.message);
    process.exit(1);
  }
}

ensureHrefField();