import { readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

console.log('🔍 Validating content files...');

const contentDir = join(process.cwd(), 'content');

if (!existsSync(contentDir)) {
  console.log('📁 Content directory does not exist');
  process.exit(0);
}

// Count and analyze content files
let fileCount = 0;
let totalSize = 0;
const extensions: Record<string, number> = {};
const categories: Record<string, number> = {};

function scanDirectory(dir: string, category?: string) {
  const items = readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const itemPath = join(dir, item.name);
    
    if (item.isDirectory()) {
      // Recursively scan subdirectories
      scanDirectory(itemPath, item.name);
    } else if (item.isFile()) {
      // Check if it's a content file
      const extMatch = item.name.match(/\.([a-zA-Z0-9]+)$/);
      if (extMatch) {
        const ext = extMatch[1].toLowerCase();
        const isContentFile = ['md', 'mdx', 'json', 'yml', 'yaml', 'txt'].includes(ext);
        
        if (isContentFile) {
          fileCount++;
          
          // Get file stats
          try {
            const stats = statSync(itemPath);
            totalSize += stats.size;
            
            // Track extensions
            extensions[ext] = (extensions[ext] || 0) + 1;
            
            // Track categories
            if (category) {
              categories[category] = (categories[category] || 0) + 1;
            }
          } catch (error) {
            console.log(`  ⚠️ Could not read: ${item.name}`);
          }
        }
      }
    }
  }
}

try {
  scanDirectory(contentDir);
  
  console.log(`\n📊 Content Analysis:`);
  console.log(`  Total files: ${fileCount}`);
  console.log(`  Total size: ${(totalSize / 1024).toFixed(2)} KB`);
  
  if (Object.keys(extensions).length > 0) {
    console.log(`  File types:`);
    Object.entries(extensions).forEach(([ext, count]) => {
      console.log(`    .${ext}: ${count} files`);
    });
  }
  
  if (Object.keys(categories).length > 0) {
    console.log(`  Categories:`);
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`    ${category}: ${count} files`);
    });
  }
  
  if (fileCount === 0) {
    console.log('\n⚠️ No content files found. Consider adding Markdown files to the content directory.');
  } else {
    console.log('\n✅ Content validation completed successfully');
  }
  
} catch (error: any) {
  console.error('❌ Error during content validation:', error.message);
  process.exit(1);
}

process.exit(0);