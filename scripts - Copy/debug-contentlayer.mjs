// scripts/debug-contentlayer.mjs
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🔍 Debugging Contentlayer...\n');

const contentDir = join(process.cwd(), 'content');

// Check if content directory exists
if (!existsSync(contentDir)) {
  console.log('❌ Content directory not found:', contentDir);
  process.exit(1);
}

console.log('📁 Content directory structure:');
const types = ['prints', 'blog', 'resources', 'downloads', 'books', 'events', 'strategy', 'canon', 'shorts'];

types.forEach(type => {
  const typeDir = join(contentDir, type);
  if (existsSync(typeDir)) {
    const files = readdirSync(typeDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
    console.log(`  ${type}: ${files.length} files`);
    if (files.length > 0 && files.length < 5) {
      console.log(`    Files: ${files.join(', ')}`);
    }
  } else {
    console.log(`  ${type}: ❌ Directory not found`);
  }
});

// Check prints specifically
console.log('\n📄 Print files details:');
const printsDir = join(contentDir, 'prints');
if (existsSync(printsDir)) {
  const printFiles = readdirSync(printsDir).filter(f => f.endsWith('.mdx'));
  printFiles.forEach(file => {
    console.log(`\n  ${file}:`);
    const filePath = join(printsDir, file);
    const content = require('fs').readFileSync(filePath, 'utf8');
    const frontmatter = content.split('---')[1] || '';
    const typeMatch = frontmatter.match(/type:\s*["']?([^"'\s]+)["']?/);
    if (typeMatch) {
      console.log(`    type: "${typeMatch[1]}"`);
    } else {
      console.log(`    type: ❌ Not found in frontmatter`);
    }
  });
}