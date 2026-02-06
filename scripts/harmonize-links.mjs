import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '../content');

// Expanded mapping for the final 29 links
const PATH_MAP = {
  '/lexicon/': '/vault/lexicon/',
  '/insights/': '/vault/insights/',
  '/blog/': '/vault/insights/',
  '/resources/': '/vault/resources/'
};

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) { // Target both extensions
      updateLinks(fullPath);
    }
  }
}

function updateLinks(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Pattern to find Markdown links: [Text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  const newContent = content.replace(linkRegex, (match, text, url) => {
    // Check if the URL starts with a slash but is missing /vault/
    if (url.startsWith('/') && !url.startsWith('/vault/')) {
      for (const [oldPrefix, newPrefix] of Object.entries(PATH_MAP)) {
        if (url.startsWith(oldPrefix)) {
          const newUrl = url.replace(oldPrefix, newPrefix);
          changed = true;
          return `[${text}](${newUrl})`;
        }
      }
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`[CLEANUP] ${path.relative(CONTENT_DIR, filePath)}`);
  }
}

console.log("--- 🧹 Final Link Cleanup: Standardizing Institutional Paths ---");
processDirectory(CONTENT_DIR);
console.log("✅ Cleanup complete. Run validate-links.mjs for the final verification.");