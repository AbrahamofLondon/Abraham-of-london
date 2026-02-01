import fs from 'fs';
import path from 'path';

const contentDir = path.resolve('./content');
const manifestPath = path.resolve('./vault-manifest.json');

// 1. Load and Parse Manifest Safely
let manifestData = [];
try {
  const rawData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  // Handle cases where data is { "briefs": [...] } or just [...]
  manifestData = Array.isArray(rawData) ? rawData : (rawData.briefs || []);
} catch (e) {
  console.error("❌ Failed to load manifest. Ensure scripts/build-manifest.mjs has run.");
  process.exit(1);
}

const validSlugs = new Set(manifestData.map(item => item.slug).filter(Boolean));

// 2. Define Institutional Whitelist
const whitelist = [
  '/contact',
  '/subscribe',
  '/inner-circle',
  '/about',
  '/',
  '/vault'
];

const getAllFiles = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.resolve(dir, file);
    if (fs.statSync(fullPath).isDirectory()) results = results.concat(getAllFiles(fullPath));
    else if (file.endsWith('.mdx') || file.endsWith('.md')) results.push(fullPath);
  });
  return results;
};

function validateLinks() {
  const files = getAllFiles(contentDir);
  const brokenLinks = [];

  files.forEach(fullPath => {
    const content = fs.readFileSync(fullPath, 'utf8');
    const relativeFile = path.relative(contentDir, fullPath);
    
    // Catch [text](link)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const link = match[2].trim();

      if (!link.startsWith('/')) continue;

      const isBrief = validSlugs.has(link);
      const isWhitelisted = whitelist.includes(link);
      const isAsset = link.startsWith('/assets/') || link.startsWith('/downloads/');

      if (!isBrief && !isWhitelisted && !isAsset) {
        brokenLinks.push({
          file: relativeFile,
          link: link,
          context: match[0]
        });
      }
    }
  });

  console.log(`\n--- 🔗 Validating Links across ${files.length} Briefs ---`);

  if (brokenLinks.length > 0) {
    console.error(`❌ Found ${brokenLinks.length} Broken Internal Links:`);
    console.table(brokenLinks);
    process.exit(1);
  } else {
    console.log(`✅ Success: All internal links are valid.`);
  }
}

validateLinks();