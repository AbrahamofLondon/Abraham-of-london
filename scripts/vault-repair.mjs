import { allDocuments } from '../.contentlayer/generated/index.mjs';
import fs from 'fs';
import path from 'path';

/**
 * VAULT REPAIR ENGINE
 * Safely auto-corrects internal links across 75+ intelligence briefs.
 */

const VALID_SLUGS = new Set(allDocuments.map(doc => doc.slug.startsWith('/') ? doc.slug : `/${doc.slug}`));
const SLUG_TO_FILE = Object.fromEntries(allDocuments.map(doc => [
  doc.slug.startsWith('/') ? doc.slug : `/${doc.slug}`,
  doc._raw.sourceFilePath
]));

// Map of filenames to current slugs (for "Moved File" detection)
const FILENAME_TO_SLUG = Object.fromEntries(allDocuments.map(doc => [
  path.basename(doc._raw.sourceFilePath),
  doc.slug.startsWith('/') ? doc.slug : `/${doc.slug}`
]));

console.log(`\n--- 🔧 Initialising Safe Auto-Repair ---`);

let repairCount = 0;

allDocuments.forEach(doc => {
  const filePath = path.join(process.cwd(), 'content', doc._raw.sourceFilePath);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  const linkRegex = /\[([^\]]+)\]\((?!\http|\/\/)([^)]+)\)/g;
  let hasChanges = false;

  const newContent = content.replace(linkRegex, (match, text, linkPath) => {
    const [purePath, anchor] = linkPath.split('#');
    
    // 1. If link is already valid, do nothing
    if (VALID_SLUGS.has(purePath)) return match;

    // 2. Attempt Correction: Is it just a missing leading slash?
    const withSlash = purePath.startsWith('/') ? purePath : `/${purePath}`;
    if (VALID_SLUGS.has(withSlash)) {
      hasChanges = true;
      repairCount++;
      return `[${text}](${withSlash}${anchor ? '#' + anchor : ''})`;
    }

    // 3. Attempt Correction: Was the file moved to a different folder?
    // (Checks if the filename exists elsewhere in the vault)
    const filename = path.basename(purePath);
    const correctedSlug = FILENAME_TO_SLUG[filename] || FILENAME_TO_SLUG[`${filename}.mdx`];
    
    if (correctedSlug) {
      hasChanges = true;
      repairCount++;
      console.log(`Fixed: ${purePath} -> ${correctedSlug} in ${doc._raw.sourceFilePath}`);
      return `[${text}](${correctedSlug}${anchor ? '#' + anchor : ''})`;
    }

    return match; // Keep original if no safe fix found
  });

  if (hasChanges) {
    fs.writeFileSync(filePath, newContent, 'utf8');
  }
});

console.log(`\n✅ Repair Complete. ${repairCount} links safely updated.`);