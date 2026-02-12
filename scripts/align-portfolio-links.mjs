/* scripts/align-portfolio-links.mjs */
import fs from 'fs';
import path from 'path';

const CONTENT_ROOT = 'content';
const SLUG_MAP = new Map();

// 1. Map every MDX/Binary file to its parent folder
function mapContent(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      mapContent(fullPath);
    } else {
      const extension = path.extname(file);
      const slug = path.basename(file, extension);
      const folder = path.basename(dir);
      // We store the mapping so we know 'clarity' belongs to 'lexicon'
      SLUG_MAP.set(slug, folder);
    }
  }
}

// 2. Rectify links in all MDX files
function rectify(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      rectify(fullPath);
    } else if (file.endsWith('.mdx') || file.endsWith('.md')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      SLUG_MAP.forEach((folder, slug) => {
        // Match pattern: [Title](/any-prefix/slug)
        // We exclude matches that are already correct
        const phantomRegex = new RegExp(`\\]\\(\\/(?!(?:${folder}))[\\w\\/\\-]+?\\/${slug}\\)`, 'g');
        const correctLink = `](/${folder}/${slug})`;

        if (content.match(phantomRegex)) {
          content = content.replace(phantomRegex, correctLink);
          changed = true;
        }
      });

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Aligned: ${file}`);
      }
    }
  }
}

console.log("--- ⚖️ Establishing Link Integrity ---");
mapContent(CONTENT_ROOT);
rectify(CONTENT_ROOT);
console.log("--- 🛡️ Portfolio synchronized with physical directory structure ---");