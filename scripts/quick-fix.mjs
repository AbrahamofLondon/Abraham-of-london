// scripts/quick-fix.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixes = [
  {
    file: 'pages/blog/[slug].tsx',
    pattern: /<ReadTime minutes=\{post\.readTime\} \/>/g,
    replacement: '{post.readTime && <ReadTime minutes={post.readTime} />}'
  },
  {
    file: 'pages/books/[slug].tsx',
    pattern: /author=\{book\.author\}/g,
    replacement: 'author={book.author || ""}'
  },
  {
    file: 'pages/books/[slug].tsx',
    pattern: /coverImage=\{book\.coverImage\}/g,
    replacement: 'coverImage={book.coverImage || ""}'
  },
  {
    file: 'pages/board/c.tsx',
    pattern: /\.map\(\(slug: string\) =>/g,
    replacement: '.map((slug: string | null) => slug ?'
  }
];

async function applyFix(file, pattern, replacement) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(pattern, replacement);
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Fixed: ${file}`);
  } else {
    console.log(`ℹ️  No changes needed: ${file}`);
  }
}

// Apply all fixes
for (const fix of fixes) {
  await applyFix(fix.file, fix.pattern, fix.replacement);
}
