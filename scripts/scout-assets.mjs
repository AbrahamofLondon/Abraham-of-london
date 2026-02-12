/* scripts/scout-assets.mjs */
import fs from 'fs';
import path from 'path';

const SEARCH_PATHS = [
  'public/assets',
  'public/downloads',
  'content'
];

console.log("--- 🔍 Global Asset Scout ---");

SEARCH_PATHS.forEach(p => {
  const fullPath = path.resolve(p);
  if (fs.existsSync(fullPath)) {
    const files = fs.readdirSync(fullPath, { recursive: true });
    const pdfs = files.filter(f => f.endsWith('.pdf'));
    const mdx = files.filter(f => f.endsWith('.mdx'));
    
    console.log(`\n📂 Directory: ${p}`);
    console.log(`   📄 MDX Files: ${mdx.length}`);
    console.log(`   📕 PDF Assets: ${pdfs.length}`);
    
    if (pdfs.length > 0) {
      console.log(`   📍 Sample PDF Path: ${pdfs[0]}`);
    }
  } else {
    console.log(`\n❌ Path not found: ${p}`);
  }
});

console.log("\n--- 🏁 Scout Complete ---");