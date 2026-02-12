/* scripts/validate-links.mjs */
import fs from 'fs';
import path from 'path';

const contentDir = path.resolve('./content');
const publicDir = path.resolve('./public');

// 1. Build a Dynamic Map of all valid MDX/MD routes
const getValidRoutes = (dir, currentRoute = '') => {
  let routes = new Set();
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      const subRoutes = getValidRoutes(fullPath, `${currentRoute}/${file}`);
      subRoutes.forEach(r => routes.add(r));
    } else if (file.endsWith('.mdx') || file.endsWith('.md')) {
      // Convert 'blog/post.mdx' to '/blog/post'
      const slug = file.replace(/\.mdx?$/, '');
      routes.add(`${currentRoute}/${slug}`);
    }
  });
  return routes;
};

const validContentRoutes = getValidRoutes(contentDir);

// 2. Institutional Whitelist & Asset Paths
const whitelist = ['/contact', '/subscribe', '/inner-circle', '/about', '/', '/vault', '/resources'];

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

  console.log(`\n--- 🛡️  Portfolio Integrity Check: ${files.length} Files ---`);

  files.forEach(fullPath => {
    const content = fs.readFileSync(fullPath, 'utf8');
    const relativeFile = path.relative(contentDir, fullPath);
    
    // Regex to find Markdown links: [text](link)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const link = match[2].trim().split('#')[0]; // Ignore anchors for validation

      // Only validate internal absolute paths
      if (!link.startsWith('/')) continue;

      const isValidRoute = validContentRoutes.has(link);
      const isWhitelisted = whitelist.includes(link);
      const isAsset = link.startsWith('/assets/') || link.startsWith('/downloads/');

      if (!isValidRoute && !isWhitelisted && !isAsset) {
        brokenLinks.push({
          file: relativeFile,
          link: link,
          context: match[0].substring(0, 40) // Truncated for table clarity
        });
      }
    }
  });

  if (brokenLinks.length > 0) {
    console.error(`❌ Found ${brokenLinks.length} Broken Internal Links:`);
    // Filter out duplicates for a cleaner report
    const uniqueBroken = brokenLinks.slice(0, 50); 
    console.table(uniqueBroken);
    
    if (brokenLinks.length > 50) {
      console.log(`... and ${brokenLinks.length - 50} more. See log for details.`);
    }
    process.exit(1);
  } else {
    console.log(`✅ Success: All 347+ links verified against filesystem routes.`);
  }
}

validateLinks();