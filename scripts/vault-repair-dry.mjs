import fs from 'fs';
import path from 'path';

const CONTENT_ROOT = path.join(process.cwd(), 'content');
const DIRS = ['shorts', 'dispatches', 'vault', 'resources', 'lexicon'];

console.log('\n🔍 [DRY_RUN] Simulating Abraham of London Vault Alignment...\n');

// 1. Build the Sitemap of what exists
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
ALL_FILES.forEach(filePath => {
  const relative = path.relative(CONTENT_ROOT, filePath);
  const slug = '/' + relative.replace(/\\/g, '/').replace(/\.mdx?$/, '');
  SLUG_MAP[slug] = true;
});

// 2. Simulate Repairs
let metaNeeded = 0;
let linksToHeal = 0;

ALL_FILES.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  const changes = [];

  // Metadata check
  if (!content.includes('accessLevel:')) {
    changes.push('Inject accessLevel');
    metaNeeded++;
  }
  if (content.includes('category: [')) {
    changes.push('Flatten Category Array');
    metaNeeded++;
  }

  // Link check
  const linkRegex = /\[([^\]]+)\]\((?!\http|\/\/)([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const [_, text, linkPath] = match;
    const purePath = linkPath.split('#')[0];
    const withSlash = purePath.startsWith('/') ? purePath : `/${purePath}`;
    
    if (!SLUG_MAP[purePath] && !SLUG_MAP[withSlash]) {
      changes.push(`Heal Link: [${text}](${linkPath})`);
      linksToHeal++;
    }
  }

  if (changes.length > 0) {
    console.log(`📄 ${fileName}`);
    changes.forEach(c => console.log(`   └─ ${c}`));
  }
});

console.log(`\n📊 --- DRY RUN SUMMARY ---`);
console.log(`Scanned: ${ALL_FILES.length} files`);
console.log(`Fixes Pending: ${metaNeeded} Metadata, ${linksToHeal} Links`);
console.log(`\n[STRATEGY] Run 'pnpm vault:fix' to commit these changes.\n`);
