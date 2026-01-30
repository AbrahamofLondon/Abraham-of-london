// scripts/fix-mdx-paths.mjs
// Fixes downloadFile paths in MDX to use /assets/downloads/ instead of /downloads/

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function fixMDXFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Fix downloadFile paths: /downloads/ -> /assets/downloads/
  const fixedContent = content.replace(
    /downloadFile:\s*["']\/downloads\//g,
    'downloadFile: "/assets/downloads/'
  );
  
  if (content !== fixedContent) {
    await fs.writeFile(filePath, fixedContent, 'utf-8');
    return true;
  }
  
  return false;
}

async function walkDirectory(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...await walkDirectory(fullPath));
    } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function main() {
  console.log('🔧 Fixing MDX downloadFile paths...\n');
  
  const contentDir = path.join(rootDir, 'content');
  const mdxFiles = await walkDirectory(contentDir);
  
  console.log(`Found ${mdxFiles.length} MDX files\n`);
  
  let fixed = 0;
  
  for (const file of mdxFiles) {
    const wasFixed = await fixMDXFile(file);
    if (wasFixed) {
      const relativePath = path.relative(rootDir, file);
      console.log(`✅ Fixed: ${relativePath}`);
      fixed++;
    }
  }
  
  console.log();
  
  if (fixed > 0) {
    console.log(`✅ Fixed ${fixed} MDX files`);
    console.log('\nRun "pnpm run content:build" to rebuild content layer');
  } else {
    console.log('ℹ️  No files needed fixing');
  }
}

main().catch(console.error);