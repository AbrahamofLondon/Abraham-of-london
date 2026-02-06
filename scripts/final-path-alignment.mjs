import fs from 'fs';
import path from 'path';

const files = [
  'content/blog/fathering-principles.mdx',
  'content/blog/fathering-without-fear-teaser.mdx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Change /vault/insights/ to /vault/blog/ to match physical file structure
    const updated = content.replace(/\/vault\/insights\//g, '/vault/blog/');
    fs.writeFileSync(file, updated);
    console.log(`✅ Aligned paths in ${file}`);
  }
});