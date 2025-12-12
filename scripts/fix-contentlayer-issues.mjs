// scripts/fix-contentlayer-issues.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const contentDir = join(process.cwd(), 'content');

function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = join(dir, file.name);
    if (file.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else if (file.isFile() && /\.(md|mdx)$/.test(file.name)) {
      fileList.push(fullPath);
    }
  }
  
  return fileList;
}

function fixYamlDuplicates(content) {
  // Fix duplicate YAML keys
  const lines = content.split('\n');
  const seenKeys = new Set();
  const fixedLines = [];
  
  for (const line of lines) {
    const match = line.match(/^(\w+):/);
    if (match) {
      const key = match[1];
      if (seenKeys.has(key)) {
        continue; // Skip duplicate key
      }
      seenKeys.add(key);
    }
    fixedLines.push(line);
  }
  
  // Fix Windows line endings and remove \r from values
  return fixedLines
    .join('\n')
    .replace(/\r\n/g, '\n')
    .replace(/: "([^"]*)"\r/g, ': "$1"')
    .replace(/: ([^\r\n]+)\r/g, ': $1')
    .replace(/: "([^"]*)"\r\n/g, ': "$1"\n')
    .replace(/: ([^\r\n]+)\r\n/g, ': $1\n')
    .replace(/draft: "false"/g, 'draft: false')
    .replace(/draft: "true"/g, 'draft: true')
    .replace(/draft:\s*"false\\r"/g, 'draft: false');
}

async function fixFiles() {
  console.log('🔧 Fixing Contentlayer issues...');
  
  const files = getAllFiles(contentDir);
  let fixedCount = 0;
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      const fixed = fixYamlDuplicates(content);
      
      if (content !== fixed) {
        writeFileSync(file, fixed, 'utf8');
        console.log(`  ✓ Fixed: ${file.replace(contentDir + '\\', '')}`);
        fixedCount++;
      }
    } catch (error) {
      console.log(`  ✗ Error fixing ${file}:`, error.message);
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} files`);
  
  // Fix specific problematic files
  const problemFiles = [
    'resources/getting-started.mdx',
    'strategy/sample-strategy.mdx'
  ];
  
  for (const relativePath of problemFiles) {
    const file = join(contentDir, relativePath);
    try {
      if (statSync(file)) {
        let content = readFileSync(file, 'utf8');
        
        // Fix draft field with \r
        content = content.replace(/draft: "false\\r"/, 'draft: false');
        content = content.replace(/draft: "false"/, 'draft: false');
        
        // Ensure date field exists
        if (!content.includes('date:')) {
          const today = new Date().toISOString().split('T')[0];
          content = content.replace(/(---\s*\ntitle:)/, `---\ndate: "${today}"\n$1`);
        }
        
        writeFileSync(file, content, 'utf8');
        console.log(`  ✓ Fixed specific issues in: ${relativePath}`);
      }
    } catch (error) {
      // File doesn't exist, skip
    }
  }
}

fixFiles().catch(console.error);