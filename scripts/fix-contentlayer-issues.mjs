#!/usr/bin/env node
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const contentDir = join(rootDir, 'content');

const filesToFix = [
  {
    path: 'canon/volume-i-foundations-of-purpose.mdx',
    fixes: {
      date: '"2024-01-01"'
    }
  },
  {
    path: 'events/founders-salon.mdx',
    fixes: {
      eventDate: '"2024-03-15"'
    }
  },
  {
    path: 'events/leadership-workshop.mdx',
    fixes: {
      eventDate: '"2024-04-20"'
    }
  },
  {
    path: 'downloads/board-investor-onepager.mdx',
    fixes: {
      date: '"2024-02-01"'
    }
  },
  {
    path: 'resources/getting-started.mdx',
    fixes: {
      date: '"2024-01-15"'
    }
  },
  {
    path: 'resources/strategic-frameworks.md',
    fixes: {
      date: '"2024-01-10"'
    }
  }
];

async function fixFile(filePath, fixes) {
  try {
    const fullPath = join(contentDir, filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    
    let updated = content;
    for (const [key, value] of Object.entries(fixes)) {
      // Check if the key exists but might be malformed
      if (content.includes(`${key}:`)) {
        // Fix malformed YAML lines
        const regex = new RegExp(`^${key}:\\s*(.*)$`, 'm');
        updated = updated.replace(regex, `${key}: ${value}`);
      } else {
        // Add missing key after the frontmatter start
        const frontmatterStart = updated.indexOf('---');
        const frontmatterEnd = updated.indexOf('---', frontmatterStart + 3);
        const frontmatter = updated.substring(frontmatterStart + 3, frontmatterEnd);
        
        // Add the missing key at the end of frontmatter
        const newFrontmatter = frontmatter.trim() + `\n${key}: ${value}\n`;
        updated = updated.substring(0, frontmatterStart + 3) + newFrontmatter + updated.substring(frontmatterEnd);
      }
    }
    
    await fs.writeFile(fullPath, updated, 'utf8');
    console.log(`✓ Fixed ${filePath}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to fix ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Fixing ContentLayer issues...\n');
  
  let successCount = 0;
  for (const file of filesToFix) {
    const success = await fixFile(file.path, file.fixes);
    if (success) successCount++;
  }
  
  console.log(`\n✅ Fixed ${successCount}/${filesToFix.length} files`);
  
  if (successCount === filesToFix.length) {
    console.log('All files fixed successfully!');
  } else {
    console.log('Some files could not be fixed. Please check manually.');
    process.exit(1);
  }
}

main().catch(console.error);