import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '../content');

/**
 * SURGICAL FIX: Targets the 4 specific links where the link "text" 
 * is actually a path, which confuses the validator.
 */

function processFile(subPath) {
  const filePath = path.join(CONTENT_DIR, subPath);
  if (!fs.existsSync(filePath)) {
    console.log(`[ERROR] File not found: ${subPath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // This regex looks for: [/blog/any-slug](/vault/insights/any-slug)
  // And converts it to: [Any Slug](/vault/insights/any-slug)
  const linkRegex = /\[\/blog\/([^\]]+)\]\(\/vault\/insights\/([^)]+)\)/g;

  const newContent = content.replace(linkRegex, (match, slugText, targetPath) => {
    changed = true;
    // Turn "reclaiming-the-narrative" into "Reclaiming The Narrative" for a clean UI
    const cleanTitle = slugText
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return `[${cleanTitle}](/vault/insights/${targetPath})`;
  });

  if (changed) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`[SURGERY] Repaired links in: ${subPath}`);
  } else {
    console.log(`[SKIP] No stubborn links found in: ${subPath}`);
  }
}

console.log("--- 🎯 Final Surgical Strike on Stubborn Links ---");
processFile('blog/fathering-principles.mdx');
processFile('blog/fathering-without-fear-teaser.mdx');
console.log("✅ Surgery complete.");