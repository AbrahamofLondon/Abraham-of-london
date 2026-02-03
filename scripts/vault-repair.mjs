/* scripts/vault-repair.mjs — UNIFIED INSTITUTIONAL REPAIR ENGINE */
import fs from 'fs';
import path from 'path';

const CONTENT_ROOT = path.join(process.cwd(), 'content');
const DIRS_TO_REPAIR = ['shorts', 'dispatches', 'vault', 'resources', 'lexicon'];

// Paths that are valid Next.js routes or static assets and should not be "healed" as content
const VALID_SYSTEM_PATHS = [
  '/contact', 
  '/subscribe', 
  '/inner-circle', 
  '/downloads', 
  '/assets', 
  '/api', 
  '/lexicon', 
  '/insights'
];

console.log('🏛️  [MASTER_REPAIR] Initiating Full Portfolio Alignment...');

// --- STEP 1: DIRECTORY SENSE CHECK ---
if (!fs.existsSync(CONTENT_ROOT)) {
  fs.mkdirSync(CONTENT_ROOT, { recursive: true });
}

DIRS_TO_REPAIR.forEach(dir => {
  const dirPath = path.join(CONTENT_ROOT, dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

// --- STEP 2: MAP BUILDING ---
const ALL_FILES = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
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
  // Normalize to standard web slugs (e.g., /shorts/my-brief)
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

  // A. Metadata Injection (Strict Adherence to Intelligence Schema)
  if (!content.includes('accessLevel:')) {
    const lines = content.split('\n');
    if (lines[0].startsWith('---')) {
      const defaultLevel = filePath.includes('vault') ? 'inner-circle' : 'public';
      lines.splice(1, 0, `accessLevel: "${defaultLevel}"`);
      content = lines.join('\n');
      metaFixed++;
      hasChanges = true;
    }
  }

  // B. Category Array Flattening (for Contentlayer stability)
  if (content.includes('category: [')) {
    content = content.replace(/category:\s*\[\s*["'](.+?)["'].*?\]/g, 'category: "$1"');
    metaFixed++;
    hasChanges = true;
  }

  // C. SEMANTIC LINK HEALING (The "Insights" Migration)
  const semanticRegex = /\]\(\/(blog|articles|news)\//g;
  if (semanticRegex.test(content)) {
    content = content.replace(semanticRegex, '](/insights/');
    linksFixed++;
    hasChanges = true;
  }

  // D. STRUCTURAL LINK RESOLUTION
  const linkRegex = /\[([^\]]+)\]\((?!\http|\/\/)([^)]+)\)/g;
  content = content.replace(linkRegex, (match, text, linkPath) => {
    const [purePath, anchor] = linkPath.split('#');
    const suffix = anchor ? `#${anchor}` : '';
    const withSlash = purePath.startsWith('/') ? purePath : `/${purePath}`;
    
    // 1. Bypass if it's already a valid internal content slug
    if (SLUG_MAP[purePath] || SLUG_MAP[withSlash]) return match;

    // 2. Bypass if it's a valid System/Asset route (prevents false positives)
    if (VALID_SYSTEM_PATHS.some(route => withSlash.startsWith(route))) return match;

    // 3. Resolve by filename (handles 'my-post.mdx' -> '/shorts/my-post')
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