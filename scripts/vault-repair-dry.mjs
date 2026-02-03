/* scripts/vault-repair.mjs — UNIFIED INSTITUTIONAL REPAIR ENGINE */
import fs from 'fs';
import path from 'path';

const CONTENT_ROOT = path.join(process.cwd(), 'content');
const DIRS_TO_REPAIR = ['shorts', 'dispatches', 'vault', 'lexicon', 'resources'];

// Routes that exist in Next.js but not in the /content folder
const SYSTEM_ROUTES = ['/contact', '/subscribe', '/about', '/inner-circle'];

// SAFE LIST: File extensions and patterns that should never be modified
const SAFE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.avif'];
const SAFE_PATTERNS = ['http://', 'https://', 'mailto:', 'tel:'];

console.log('🏛️  [MASTER_REPAIR] Initiating Full Portfolio Alignment...');

// --- STEP 1: MAP BUILDING ---
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
const TITLE_TO_SLUG = {};

ALL_FILES.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relative = path.relative(CONTENT_ROOT, filePath);
    // Normalizes content/lexicon/purpose.mdx -> /lexicon/purpose
    const slug = '/' + relative.replace(/\\/g, '/').replace(/\.mdx?$/, '');
    
    // Extract title from frontmatter for additional resolution
    const titleMatch = content.match(/title:\s*["']?([^"\n]+)["']?/);
    if (titleMatch) {
      const title = titleMatch[1].toLowerCase().trim();
      TITLE_TO_SLUG[title] = slug;
    }
    
    const filename = path.basename(relative);
    SLUG_MAP[slug] = true;
    FILENAME_TO_SLUG[filename] = slug;
    FILENAME_TO_SLUG[filename.replace(/\.mdx?$/, '')] = slug;
  } catch (error) {
    console.warn(`⚠️ [MAP_ERROR] Failed to process ${filePath}:`, error.message);
  }
});

// --- STEP 2: SURGICAL REPAIR ---
let linksFixed = 0;
let metaFixed = 0;
let brokenLinks = [];

ALL_FILES.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  // A. Metadata Injection & Repair
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

  // B. Advanced Link Healing (Lexicon & System Resolution)
  const linkRegex = /\[([^\]]+)\]\((?!\http|\/\/)([^)]+)\)/g;
  
  content = content.replace(linkRegex, (match, text, linkPath) => {
    const [purePath, anchor] = linkPath.split('#');
    
    // 1. SAFE LIST: Ignore these immediately
    const isPdf = purePath.endsWith('.pdf');
    const isSystemRoute = SYSTEM_ROUTES.includes(purePath);
    const isExternal = purePath.startsWith('http');
    const hasSafeExtension = SAFE_EXTENSIONS.some(ext => purePath.endsWith(ext));
    const hasSafePattern = SAFE_PATTERNS.some(pattern => purePath.startsWith(pattern));

    if (isPdf || isSystemRoute || isExternal || hasSafeExtension || hasSafePattern) {
      return match; // Leave the link exactly as it is
    }

    const suffix = anchor ? `#${anchor}` : '';
    
    // 2. NORMALIZE LEXICON (Fixes the /vault/lexicon drift)
    let correctedPath = purePath.replace(/^\/vault\/lexicon/, '/lexicon');
    
    // 3. Ensure leading slash for internal paths
    if (!correctedPath.startsWith('/')) correctedPath = `/${correctedPath}`;
    
    // 4. VALIDATE & HEAL against slug map
    if (SLUG_MAP[correctedPath]) {
      if (correctedPath !== purePath) {
        linksFixed++;
        hasChanges = true;
      }
      return `[${text}](${correctedPath}${suffix})`;
    }
    
    // 5. Try title-based resolution (for links using document titles)
    const normalizedText = text.toLowerCase().trim();
    if (TITLE_TO_SLUG[normalizedText]) {
      const resolvedSlug = TITLE_TO_SLUG[normalizedText];
      linksFixed++;
      hasChanges = true;
      console.log(`📘 [TITLE_RESOLVE] "${text}" → ${resolvedSlug}`);
      return `[${text}](${resolvedSlug}${suffix})`;
    }

    // 6. Try filename resolution (the "Last Resort")
    const fname = path.basename(purePath);
    if (FILENAME_TO_SLUG[fname]) {
      const resolvedSlug = FILENAME_TO_SLUG[fname];
      linksFixed++;
      hasChanges = true;
      console.log(`🔍 [FILENAME_RESOLVE] "${fname}" → ${resolvedSlug}`);
      return `[${text}](${resolvedSlug}${suffix})`;
    }

    // 7. Flag broken links for manual review
    if (purePath && !purePath.includes('://')) {
      brokenLinks.push({
        file: path.relative(process.cwd(), filePath),
        link: purePath,
        context: text,
        anchor: anchor || null
      });
      console.warn(`❌ [BROKEN_LINK] ${path.relative(process.cwd(), filePath)}: "${text}" → ${purePath}`);
    }

    return match; // If we still can't find it, don't break it further
  });

  // C. Frontmatter Date Normalization
  const dateMatch = content.match(/date:\s*([^\n]+)/);
  if (dateMatch) {
    const dateValue = dateMatch[1].trim();
    // Try to parse and normalize the date format
    try {
      const parsedDate = new Date(dateValue);
      if (!isNaN(parsedDate.getTime())) {
        const isoDate = parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD
        if (dateValue !== isoDate) {
          content = content.replace(/date:\s*[^\n]+/, `date: "${isoDate}"`);
          hasChanges = true;
        }
      }
    } catch (error) {
      // Date parsing failed, leave as-is
    }
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

// --- STEP 3: REPORTING ---
console.log(`\n✅ ALIGNMENT COMPLETE`);
console.log(`📊 Metadata Patched: ${metaFixed}`);
console.log(`📊 Links Healed:    ${linksFixed}`);
console.log(`📊 Total Portfolio: ${ALL_FILES.length} briefs`);

if (brokenLinks.length > 0) {
  console.log(`\n⚠️  BROKEN LINKS FOUND (${brokenLinks.length}):`);
  brokenLinks.forEach((link, index) => {
    console.log(`   ${index + 1}. ${link.file} → "${link.context}" (${link.link})`);
  });
  
  // Write broken links report
  const reportPath = path.join(process.cwd(), 'logs', 'broken-links.json');
  if (!fs.existsSync(path.dirname(reportPath))) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  }
  fs.writeFileSync(reportPath, JSON.stringify(brokenLinks, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

// --- STEP 4: SUMMARY MANIFEST ---
const summary = {
  timestamp: new Date().toISOString(),
  filesProcessed: ALL_FILES.length,
  metadataFixed: metaFixed,
  linksFixed: linksFixed,
  brokenLinksCount: brokenLinks.length,
  brokenLinks: brokenLinks,
  slugMapSize: Object.keys(SLUG_MAP).length,
  filenameMapSize: Object.keys(FILENAME_TO_SLUG).length,
  titleMapSize: Object.keys(TITLE_TO_SLUG).length
};

const manifestPath = path.join(process.cwd(), 'public/system/repair-manifest.json');
if (!fs.existsSync(path.dirname(manifestPath))) {
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
}
fs.writeFileSync(manifestPath, JSON.stringify(summary, null, 2));

console.log(`\n📁 Maps generated:`);
console.log(`   • Slug Map: ${summary.slugMapSize} entries`);
console.log(`   • Filename Map: ${summary.filenameMapSize} entries`);
console.log(`   • Title Map: ${summary.titleMapSize} entries`);
console.log(`\n📄 Summary manifest saved to: ${manifestPath}`);