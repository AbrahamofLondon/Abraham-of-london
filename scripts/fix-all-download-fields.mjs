// scripts/fix-all-download-fields.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

async function fixAllDownloadFiles() {
  console.log('🔧 Fixing all Download files...\n');
  
  const mdxFiles = await glob('content/downloads/*.mdx');
  const fixes = [];
  
  for (const file of mdxFiles) {
    const filePath = path.join(rootDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Only process Download type files
    if (!content.includes('type: Download')) continue;
    
    console.log(`Processing: ${file}`);
    
    let newContent = content;
    let changes = [];
    
    // 1. Ensure href field exists (required by Contentlayer)
    if (!content.includes('\nhref:')) {
      // Find where to add href - usually after format or file field
      if (content.includes('\nformat:')) {
        newContent = newContent.replace(/(\nformat:[^\n]*)/, '$1\nhref: /assets/downloads/' + path.basename(file, '.mdx') + '.pdf');
      } else if (content.includes('\ndownloadUrl:')) {
        newContent = newContent.replace(/(\ndownloadUrl:[^\n]*)/, 'href: /assets/downloads/' + path.basename(file, '.mdx') + '.pdf$1');
      } else if (content.includes('\nfile:')) {
        newContent = newContent.replace(/(\nfile:[^\n]*)/, '$1\nhref: /assets/downloads/' + path.basename(file, '.mdx') + '.pdf');
      } else {
        // Add after slug as last resort
        newContent = newContent.replace(/(\nslug:[^\n]*)/, '$1\nhref: /assets/downloads/' + path.basename(file, '.mdx') + '.pdf');
      }
      changes.push('+href');
    }
    
    // 2. Ensure downloadUrl field exists (your custom field)
    if (!content.includes('\ndownloadUrl:')) {
      // Add downloadUrl, typically same as href
      newContent = newContent.replace(/(\nhref:[^\n]*)/, '$1\ndownloadUrl: /assets/downloads/' + path.basename(file, '.mdx') + '.pdf');
      changes.push('+downloadUrl');
    }
    
    // 3. Ensure file field exists (your custom field)
    if (!content.includes('\nfile:')) {
      // Add file field
      newContent = newContent.replace(/(\ndownloadUrl:[^\n]*)/, '$1\nfile: /assets/downloads/' + path.basename(file, '.mdx') + '.pdf');
      changes.push('+file');
    }
    
    // 4. Remove duplicate downloadUrl fields if any
    const downloadUrlCount = (newContent.match(/downloadUrl:/g) || []).length;
    if (downloadUrlCount > 1) {
      // Keep only the first downloadUrl
      const lines = newContent.split('\n');
      let foundFirst = false;
      const filteredLines = lines.filter(line => {
        if (line.trim().startsWith('downloadUrl:')) {
          if (!foundFirst) {
            foundFirst = true;
            return true;
          }
          return false; // Skip duplicates
        }
        return true;
      });
      newContent = filteredLines.join('\n');
      changes.push('-dupDownloadUrl');
    }
    
    if (changes.length > 0) {
      // Create backup
      const backupPath = filePath + '.backup-' + Date.now();
      fs.writeFileSync(backupPath, content);
      
      // Save fixed content
      fs.writeFileSync(filePath, newContent);
      fixes.push({ file, changes });
      console.log(`  ✅ Fixed: ${changes.join(', ')}`);
    } else {
      console.log(`  ✓ Already correct`);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`Fixed ${fixes.length} files:`);
  fixes.forEach(fix => {
    console.log(`  - ${fix.file}: ${fix.changes.join(', ')}`);
  });
  
  // Create a report
  const report = {
    timestamp: new Date().toISOString(),
    filesFixed: fixes.length,
    details: fixes
  };
  
  fs.writeFileSync(
    path.join(rootDir, 'download-fixes-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📝 Report saved: download-fixes-report.json');
}

fixAllDownloadFiles().catch(console.error);