import fs from 'fs';
import path from 'path';

const files = [
  'content/blog/fathering-principles.mdx',
  'content/blog/fathering-without-fear-teaser.mdx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // 1. Remove the /vault prefix to match manifest slugs
    let updated = content.replace(/\/vault\/blog\//g, '/blog/');
    
    // 2. Fix the specific teaser link mismatch
    updated = updated.replace(/\/blog\/fathering-without-fear(?!\-teaser)/g, '/blog/fathering-without-fear-teaser');

    if (content !== updated) {
      fs.writeFileSync(file, updated);
      console.log(`✅ Fixed manifest alignment in ${file}`);
    } else {
      console.log(`[OK] No changes needed for ${file}`);
    }
  }
});