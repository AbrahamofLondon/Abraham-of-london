/* scripts/refresh-downloads.js */
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import matter from 'gray-matter';

const CONTENT_PATH = path.join(process.cwd(), 'content');
const PUBLIC_PATH = path.join(process.cwd(), 'public');

/**
 * AUTHORIZED_ROUTES
 * Strategic mapping of the Abraham-of-London digital ecosystem.
 */
const AUTHORIZED_ROUTES = [
  '/vault', 
  '/lexicon', 
  '/blog', 
  '/resources', 
  '/downloads', 
  '/assets', 
  '/books', 
  '/inner-circle', 
  '/contact',
  '/subscribe',
  '/newsletter',
  '/events',
  '/about',
  '/insights' // Authorizes the 75 Intelligence Briefs
].map(route => route.toLowerCase());

const getFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const res = path.resolve(dir, entry.name);
    return entry.isDirectory() ? getFiles(res) : res;
  });
};

async function executeAudit() {
  console.log(chalk.blue.bold("\n🛡️  [ABRAHAM-OF-LONDON]: Institutional Integrity Audit\n"));

  const mdxFiles = getFiles(CONTENT_PATH).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
  let linkErrors = 0;
  let missingAssets = 0;
  let verifiedAssets = 0;

  mdxFiles.forEach(file => {
    const rawContent = fs.readFileSync(file, 'utf8');
    const { data, content } = matter(rawContent);
    const relativeFile = path.relative(CONTENT_PATH, file);

    // 1. LINK VALIDATION
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const url = match[2];
      
      // Skip protocols and anchors
      if (url.startsWith('http') || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) continue;
      
      // Normalize leading slash and casing for comparison
      const normalizedUrl = (url.startsWith('/') ? url : `/${url}`).toLowerCase();
      
      if (!AUTHORIZED_ROUTES.some(route => normalizedUrl.startsWith(route))) {
        console.log(chalk.red(`❌ [LINK_REGRESSION] ${relativeFile}: "${url}" is unauthorized.`));
        // Strategic Debug: Shows exactly what the normalization saw
        console.log(chalk.gray(`   Normalized as: ${normalizedUrl}`)); 
        linkErrors++;
      }
    }

    // 2. ASSET PHYSICAL VERIFICATION
    const downloadUrl = data.downloadUrl || data.assetPath;
    if (downloadUrl && downloadUrl.startsWith('/')) {
      const cleanPath = downloadUrl.split('/').filter(p => p !== '');
      const physicalPath = path.join(PUBLIC_PATH, ...cleanPath);
      
      if (fs.existsSync(physicalPath)) {
        verifiedAssets++;
      } else {
        console.log(chalk.yellow(`⚠️  [MISSING_ASSET] ${relativeFile} -> Reference: ${downloadUrl}`));
        missingAssets++;
      }
    }
  });

  console.log(chalk.blue.bold('\n--- 📊 AUDIT REPORT ---'));
  console.log(`Files Scanned: ${mdxFiles.length} | Verified: ${verifiedAssets} | Missing: ${missingAssets}`);

  if (linkErrors > 0) {
    console.log(chalk.red.bold(`\n🚨 REJECTED: ${linkErrors} Link Regressions found.`));
    console.log(chalk.red(`Ensure all links start with authorized prefixes in scripts/refresh-downloads.js`));
    process.exit(1);
  }

  console.log(chalk.green.bold('✅ SYSTEM ALIGNED.'));
  process.exit(0);
}

executeAudit();