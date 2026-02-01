import fs from 'fs';
import path from 'path';

/**
 * INSTITUTIONAL SLUG REPAIR v2.0
 * Corrects 142+ relative slugs to absolute path-prefixed slugs.
 */
const contentDir = path.resolve('./content');

const getAllFiles = (dir) => {
  let results = [];
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

function repair() {
  const files = getAllFiles(contentDir);
  let fixedCount = 0;

  files.forEach(fullPath => {
    const relativeToContent = path.relative(contentDir, fullPath);
    const pathParts = relativeToContent.split(path.sep);
    
    // The first directory name (e.g., 'shorts', 'blog', 'downloads')
    const category = pathParts[0];
    let content = fs.readFileSync(fullPath, 'utf8');

    /**
     * Regex breakdown:
     * slug:\s* -> matches 'slug:' and any whitespace
     * ["']?         -> matches an optional quote
     * ([^/"'\s][^"'\s]*) -> captures slug if it DOES NOT start with / or "
     * ["']?         -> matches an optional closing quote
     */
    const relativeSlugRegex = /slug:\s*["']?([^/"'\s][^"'\s]*)["']?/g;

    if (relativeSlugRegex.test(content)) {
      const updatedContent = content.replace(relativeSlugRegex, (match, slugValue) => {
        // Construct: /category/slug-name
        const absoluteSlug = `/${category}/${slugValue}`;
        return `slug: ${absoluteSlug}`;
      });

      fs.writeFileSync(fullPath, updatedContent, 'utf8');
      fixedCount++;
      console.log(`✅ Repaired: ${relativeToContent} -> slug: /${category}/...`);
    }
  });

  console.log(`\n--- 🏗️  Repair Complete: ${fixedCount} files updated. ---`);
}

repair();