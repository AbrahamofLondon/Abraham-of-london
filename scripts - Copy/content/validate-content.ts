import { readdirSync, existsSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 Validating content files...');

const contentDir = join(process.cwd(), 'content');

if (!existsSync(contentDir)) {
  console.log('📁 Content directory does not exist');
  process.exit(0);
}

// Track validation issues
const validationErrors: Array<{file: string, errors: string[]}> = [];
const validationWarnings: Array<{file: string, warnings: string[]}> = [];

// Count and analyze content files
let fileCount = 0;
let totalSize = 0;
const extensions: Record<string, number> = {};
const categories: Record<string, number> = {};

function validateMdxFile(filePath: string, category?: string) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for category arrays (will break build)
    if (content.includes('category: [')) {
      errors.push('Category field is an array - should be single string. Will cause build failure.');
    }

    // Check for problematic access field
    const accessMatch = content.match(/access:\s*\n\s+tier:/);
    if (accessMatch) {
      warnings.push('Access field with tier may cause validation issues. Consider using draft: true instead.');
    }

    // Check for malformed size fields
    const sizeMatch = content.match(/size:\s*(\d+(?:\.\d+)?)(?:\s|$|\n)/g);
    if (sizeMatch) {
      sizeMatch.forEach(match => {
        if (!match.includes('MB') && !match.includes('KB') && !match.includes('GB')) {
          warnings.push(`Size without unit: "${match.trim()}" - should be like "2.1MB"`);
        }
      });
    }

    // Check for missing closing frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      warnings.push('Missing or malformed frontmatter');
    }

    if (errors.length > 0) {
      validationErrors.push({ file: filePath, errors });
    }
    if (warnings.length > 0) {
      validationWarnings.push({ file: filePath, warnings });
    }
  } catch (error: any) {
    console.log(`  ⚠️ Could not validate: ${filePath} - ${error.message}`);
  }
}

function scanDirectory(dir: string, currentCategory?: string) {
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
          
          // Validate MDX/MD files for build-breaking issues
          if (ext === 'mdx' || ext === 'md') {
            validateMdxFile(itemPath, currentCategory);
          }
          
          // Get file stats
          try {
            const stats = statSync(itemPath);
            totalSize += stats.size;
            
            // Track extensions
            extensions[ext] = (extensions[ext] || 0) + 1;
            
            // Track categories
            if (currentCategory) {
              categories[currentCategory] = (categories[currentCategory] || 0) + 1;
            }
          } catch (error) {
            console.log(`  ⚠️ Could not read stats: ${item.name}`);
          }
        }
      }
    }
  }
}

function generateFixCommands(): string[] {
  const commands: string[] = [];
  
  validationErrors.forEach(({ file, errors }) => {
    if (errors.some(e => e.includes('Category field is an array'))) {
      const relativePath = file.replace(process.cwd() + '/', '');
      commands.push(`# Fix category in ${relativePath}:`);
      commands.push(`# sed -i '' "s/category: \\[.*\\]/category: \"Practical Application\"/" "${file}"`);
    }
  });
  
  return commands;
}

try {
  scanDirectory(contentDir);
  
  console.log(`\n📊 Content Analysis:`);
  console.log(`  Total files: ${fileCount}`);
  console.log(`  Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  
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
  
  // Show validation results
  if (validationErrors.length > 0) {
    console.log(`\n🚨 BUILD-BREAKING ERRORS (${validationErrors.length}):`);
    validationErrors.forEach(({ file, errors }) => {
      const relativePath = file.replace(process.cwd() + '/', '');
      console.log(`  ❌ ${relativePath}`);
      errors.forEach(error => console.log(`     • ${error}`));
    });
  }
  
  if (validationWarnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${validationWarnings.length}):`);
    validationWarnings.forEach(({ file, warnings }) => {
      const relativePath = file.replace(process.cwd() + '/', '');
      console.log(`  ⚠️  ${relativePath}`);
      warnings.forEach(warning => console.log(`     • ${warning}`));
    });
  }
  
  if (fileCount === 0) {
    console.log('\n⚠️ No content files found. Consider adding Markdown files to the content directory.');
  } else if (validationErrors.length === 0) {
    console.log('\n✅ Content validation completed - no build-breaking issues found');
  } else {
    console.log('\n❌ Content validation failed with build-breaking errors');
    
    // Generate quick fix suggestions
    console.log('\n💡 Quick fix commands:');
    const fixCommands = generateFixCommands();
    fixCommands.forEach(cmd => console.log(cmd));
    
    // Also provide a quick manual fix approach
    console.log('\n📝 Manual fix approach:');
    console.log('1. For category arrays: Change "category: [\"A\", \"B\"]" to "category: \"A\""');
    console.log('2. For access fields: Remove or replace with "draft: true"');
    console.log('3. For size units: Ensure format like "2.1MB" not just "2.1"');
    
    process.exit(1);
  }
  
} catch (error: any) {
  console.error('❌ Error during content validation:', error.message);
  process.exit(1);
}

process.exit(0);