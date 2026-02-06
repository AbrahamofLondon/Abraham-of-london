import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '../content');

// The directories to scan
const FOLDERS = ['blog', 'lexicon', 'insights', 'resources', 'canon', 'books'];

function harmonize() {
  console.log("--- 🌍 Global Institutional Link Harmonization ---");
  let fixedCount = 0;

  FOLDERS.forEach(folder => {
    const fullPath = path.join(CONTENT_DIR, folder);
    if (!fs.existsSync(fullPath)) return;

    const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));

    files.forEach(file => {
      const filePath = path.join(fullPath, file);
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;

      // Pattern: Target internal absolute links that DON'T start with /vault/
      // Example: [/blog/...] -> [/vault/blog/...]
      const linkRegex = /\[([^\]]+)\]\((?!http|#|\/vault\/)(\/[^)]+)\)/g;

      const newContent = content.replace(linkRegex, (match, text, url) => {
        changed = true;
        fixedCount++;
        return `[${text}](/vault${url})`;
      });

      if (changed) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Fixed links in: ${folder}/${file}`);
      }
    });
  });

  console.log(`\n✨ Harmonization Complete. ${fixedCount} links brought into compliance.`);
}

harmonize();