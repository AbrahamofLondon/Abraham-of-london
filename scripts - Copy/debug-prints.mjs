// scripts/debug-prints.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDir = path.join(process.cwd(), 'content/prints');

console.log('🔍 Debugging Print Files');
console.log('=' .repeat(50));

if (fs.existsSync(contentDir)) {
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.mdx'));
  console.log(`Found ${files.length} print files:\n`);
  
  files.forEach((file, index) => {
    const filePath = path.join(contentDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`${index + 1}. ${file}`);
    
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      console.log('   Frontmatter:');
      frontmatter.split('\n').forEach(line => {
        if (line.trim()) {
          console.log(`     ${line}`);
        }
      });
    }
    console.log('');
  });
} else {
  console.log('❌ Prints directory not found at:', contentDir);
}