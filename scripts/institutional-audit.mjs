/* scripts/institutional-audit.mjs */
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import matter from 'gray-matter';

const CONTENT_PATH = path.join(process.cwd(), 'content');

/**
 * AUTHORIZED_PATHS
 * Defines the strategic boundaries of the Abraham-of-London ecosystem.
 * Any link not starting with these prefixes will trigger a REJECTION.
 */
/* scripts/institutional-audit.mjs */

/**
 * AUTHORIZED_PATHS
 * Defines the strategic boundaries of the Abraham-of-London ecosystem.
 * Organized by Sector to mirror the physical 'pages/' directory.
 */
const AUTHORIZED_PREFIXES = [
  // --- CORE SECTORS ---
  '/admin',
  '/api',
  '/auth',
  '/dashboard',
  '/inner-circle',
  '/vault',
  '/registry',
  '/private',

  // --- INTELLIGENCE & CONTENT ---
  '/blog',
  '/canon',
  '/canon-campaign',
  '/insights',      // 75 Intelligence Briefs
  '/shorts',
  '/briefs',
  '/lexicon',
  '/content',

  // --- KNOWLEDGE & FRAMEWORKS ---
  '/strategy',
  '/strategy-room',
  '/leadership',
  '/fatherhood',
  '/consulting',
  '/resources',

  // --- INSTITUTIONAL ENTITIES ---
  '/board',
  '/directorate',
  '/founders',
  '/membership',
  '/ventures',

  // --- ENGAGEMENT & COMMERCE ---
  '/events',
  '/speaking',
  '/chatham-rooms',
  '/books',
  '/brands',
  '/prints',
  '/downloads',

  // --- PUBLIC INTERFACE ---
  '/about',
  '/contact',
  '/subscribe',
  '/newsletter',
  '/assets'
];

const getFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const res = path.resolve(dir, entry.name);
    return entry.isDirectory() ? getFiles(res) : res;
  });
};

async function runAudit() {
  console.log(chalk.blue.bold("\n🛡️  [INSTITUTIONAL_AUDIT]: Verifying Intelligence Architecture...\n"));

  const mdxFiles = getFiles(CONTENT_PATH).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
  let linkRegressions = 0;
  let assetsVerified = 0;
  let totalLinksChecked = 0;

  mdxFiles.forEach(file => {
    const rawContent = fs.readFileSync(file, 'utf8');
    const { data, content } = matter(rawContent);
    const relativeFile = path.relative(CONTENT_PATH, file);

    // Regex to find Markdown links: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      const url = match[2];
      totalLinksChecked++;
      
      // 1. Skip valid non-internal protocols
      if (
        url.startsWith('http') || 
        url.startsWith('#') || 
        url.startsWith('mailto:') || 
        url.startsWith('tel:')
      ) continue;

      // 2. Validate internal paths against Authorized Prefixes
      const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
      const isValid = AUTHORIZED_PREFIXES.some(prefix => normalizedUrl.startsWith(prefix));
      
      if (!isValid) {
        console.log(chalk.red(`🚨 [PATH_REGRESSION] ${relativeFile}`));
        console.log(chalk.yellow(`    Link "${url}" is unauthorized. Update AUTHORIZED_PREFIXES if this is a new route.\n`));
        linkRegressions++;
      }
    }

    // Asset tracking for Intelligence Briefs
    if (data.assetPath || data.downloadUrl || data.pdf) assetsVerified++;
  });

  console.log(chalk.blue.bold('--- 📊 AUDIT REPORT ---'));
  console.log(chalk.cyan(`Files Scanned:       ${mdxFiles.length}`));
  console.log(chalk.cyan(`Links Validated:     ${totalLinksChecked}`));
  console.log(chalk.cyan(`Briefs Verified:    ${assetsVerified}`));

  if (linkRegressions > 0) {
    console.log(chalk.red.bold(`\n❌ REJECTED: ${linkRegressions} link regressions found.`));
    console.log(chalk.red(`System alignment failed. Fix the links above or authorize the paths in the audit script.`));
    process.exit(1);
  }

  console.log(chalk.green.bold('\n✅ SUCCESS: All links aligned to Institutional Portfolio standards.'));
  process.exit(0);
}

runAudit();