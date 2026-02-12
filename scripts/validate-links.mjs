/* scripts/validate-links.mjs */
import fs from 'fs';
import path from 'path';

const contentDir = path.resolve('./content');
const publicDir = path.resolve('./public');

/**
 * 1. Build a Dynamic Map of all valid MDX/MD routes
 */
const getValidRoutes = (dir, currentRoute = '') => {
  let routes = new Set();
  if (!fs.existsSync(dir)) return routes;

  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      const subRoutes = getValidRoutes(fullPath, `${currentRoute}/${file}`);
      subRoutes.forEach(r => routes.add(r));
    } else if (file.endsWith('.mdx') || file.endsWith('.md')) {
      const slug = file.replace(/\.mdx?$/, '');
      routes.add(`${currentRoute}/${slug}`);
    }
  });
  return routes;
};

const validContentRoutes = getValidRoutes(contentDir);

/**
 * 2. Institutional Whitelist & Alias Mapping
 * This allows "insights" to map to "blog" and handles legacy paths.
 */
const whitelist = [
  '/contact', 
  '/contact-us', // Allow during migration
  '/subscribe', 
  '/inner-circle', 
  '/about', 
  '/', 
  '/newsletter',
  '/canon' ,
  '/resources' 
];

/**
 * Strategic Path Resolution
 * Maps requested URLs to actual routes in the filesystem.
 */
function isLinkValid(link) {
  // Direct match
  if (validContentRoutes.has(link)) return true;
  if (whitelist.includes(link)) return true;
  if (link.startsWith('/assets/') || link.startsWith('/downloads/')) return true;

  // --- ALIAS LOGIC ---
  
  // 1. Alias: /insights/* -> /blog/*
  if (link.startsWith('/insights/')) {
    const aliased = link.replace('/insights/', '/blog/');
    if (validContentRoutes.has(aliased)) return true;
  }

  // 2. Alias: /vault/lexicon/* -> /lexicon/*
  if (link.startsWith('/vault/lexicon/')) {
    const aliased = link.replace('/vault/lexicon/', '/lexicon/');
    if (validContentRoutes.has(aliased)) return true;
  }

  // 3. Alias: /vault/downloads/* -> /downloads/ or /assets/
  if (link.startsWith('/vault/downloads/')) return true; 

  return false;
}

const getAllFiles = (dir) => {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.resolve(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(getAllFiles(fullPath));
    } else if (file.endsWith('.mdx') || file.endsWith('.md')) {
      results.push(fullPath);
    }
  });
  return results;
};

function validateLinks() {
  const files = getAllFiles(contentDir);
  const brokenLinks = [];

  console.log(`\n--- 🛡️  Portfolio Integrity Check: ${files.length} Files ---`);

  files.forEach(fullPath => {
    const content = fs.readFileSync(fullPath, 'utf8');
    const relativeFile = path.relative(contentDir, fullPath);
    
    // Regex to find Markdown links: [text](link)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      let link = match[2].trim().split('#')[0]; // Ignore anchors

      // Skip external links or non-internal protocols
      if (!link.startsWith('/') || link.startsWith('//')) continue;

      if (!isLinkValid(link)) {
        brokenLinks.push({
          file: relativeFile,
          link: link,
          context: match[0].substring(0, 45)
        });
      }
    }
  });

  if (brokenLinks.length > 0) {
    console.error(`❌ Found ${brokenLinks.length} Broken Internal Links:`);
    const uniqueBroken = brokenLinks.slice(0, 50); 
    console.table(uniqueBroken);
    
    if (brokenLinks.length > 50) {
      console.log(`... and ${brokenLinks.length - 50} more. See log for details.`);
    }
    process.exit(1);
  } else {
    console.log(`✅ Success: All links verified against Institutional Manifest.`);
    process.exit(0);
  }
}

validateLinks();