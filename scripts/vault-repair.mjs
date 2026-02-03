// scripts/vault-repair.mjs — UNIFIED INSTITUTIONAL REPAIR ENGINE
import fs from 'fs';
import path from 'path';

/**
 * MASTER REPAIR LOGIC:
 * 1. [SHORTS PATCH] Injects accessLevel: "public" into naked shorts.
 * 2. [METADATA FLATTEN] Converts category arrays to strings.
 * 3. [LINK RESOLUTION] Heals broken internal Markdown links via slug-mapping.
 * 4. [DIR SYNC] Ensures all institutional folders exist.
 */

const CONTENT_ROOT = path.join(process.cwd(), 'content');
const DIRS_TO_REPAIR = ['shorts', 'dispatches', 'vault'];

console.log('🏛️  [MASTER_REPAIR] Initiating Full Portfolio Alignment...');

// --- STEP 1: DIRECTORY SENSE CHECK ---
if (!fs.existsSync(CONTENT_ROOT)) {
  console.log('📁 Initializing content root...');
  fs.mkdirSync(CONTENT_ROOT, { recursive: true });
}

DIRS_TO_REPAIR.forEach(dir => {
  const dirPath = path.join(CONTENT_ROOT, dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

// --- STEP 2: MAP BUILDING (For Link Resolution) ---
const ALL_FILES = [];
function walk(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const res = path.resolve(dir, f.name);
    if (f.isDirectory()) walk(res);
    else if (f.name.endsWith('.mdx') || f.name.endsWith('.md')) ALL_FILES.push(res);
  }
}
walk(CONTENT_ROOT);

const SLUG_MAP = {};
const FILENAME_TO_SLUG = {};

ALL_FILES.forEach(filePath => {
  const relative = path.relative(CONTENT_ROOT, filePath);
  const slug = '/' + relative.replace(/\\/g, '/').replace(/\.mdx?$/, '');
  const filename = path.basename(relative);
  SLUG_MAP[slug] = true;
  FILENAME_TO_SLUG[filename] = slug;
  FILENAME_TO_SLUG[filename.replace(/\.mdx?$/, '')] = slug;
});

// --- STEP 3: SURGICAL REPAIR ---
let linksFixed = 0;
let metaFixed = 0;

ALL_FILES.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  const fileName = path.basename(filePath);

  // A. Metadata Injection (Shorts & Global Access)
  if (!content.includes('accessLevel:')) {
    const lines = content.split('\n');
    if (lines[0].startsWith('---')) {
      // Determine default based on folder
      const defaultLevel = filePath.includes('vault') ? 'inner-circle' : 'public';
      lines.splice(1, 0, `accessLevel: "${defaultLevel}"`);
      content = lines.join('\n');
      metaFixed++;
      hasChanges = true;
    }
  }

  // B. Category Array Flattening
  if (content.includes('category: [')) {
    content = content.replace(/category:\s*\[\s*["'](.+?)["'].*?\]/g, 'category: "$1"');
    metaFixed++;
    hasChanges = true;
  }

  // C. Link Healing
  const linkRegex = /\[([^\]]+)\]\((?!\http|\/\/)([^)]+)\)/g;
  content = content.replace(linkRegex, (match, text, linkPath) => {
    const [purePath, anchor] = linkPath.split('#');
    const suffix = anchor ? `#${anchor}` : '';
    if (SLUG_MAP[purePath]) return match;

    const withSlash = purePath.startsWith('/') ? purePath : `/${purePath}`;
    if (SLUG_MAP[withSlash]) {
      linksFixed++;
      hasChanges = true;
      return `[${text}](${withSlash}${suffix})`;
    }

    const fname = path.basename(purePath);
    if (FILENAME_TO_SLUG[fname]) {
      linksFixed++;
      hasChanges = true;
      return `[${text}](${FILENAME_TO_SLUG[fname]}${suffix})`;
    }
    return match;
  });

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
});



console.log(`\n✅ ALIGNMENT COMPLETE`);
console.log(`📊 Metadata Patched: ${metaFixed}`);
console.log(`📊 Links Healed:    ${linksFixed}`);
console.log(`📊 Total Portfolio: ${ALL_FILES.length} briefs`);