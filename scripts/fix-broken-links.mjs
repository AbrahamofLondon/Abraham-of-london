import fs from 'fs';
import path from 'path';

const contentDir = path.resolve('./content');

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

function repairMarkdownLinks() {
  const files = getAllFiles(contentDir);
  let fixes = 0;

  console.log(`\n--- 🛡️  Surgical Link Repair: Cleaning Markdown Bodies ---`);

  files.forEach(fullPath => {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // This regex looks for patterns like (/blog/ /blog/slug) or (/resources/ /resources/slug)
    // and captures the folder name and the final slug.
    const brokenLinkRegex = /\(\/([^/]+)\/\s+\/\1\/([^)]+)\)/g;

    if (brokenLinkRegex.test(content)) {
      content = content.replace(brokenLinkRegex, (match, folder, slug) => {
        const fixedLink = `(/${folder}/${slug})`;
        return fixedLink;
      });

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Fixed link in: ${path.relative(contentDir, fullPath)}`);
        fixes++;
      }
    }
    
    // Fallback for specific double-slash/space strings that might not match the regex
    if (content.includes('/blog/ /blog/')) {
        content = content.split('/blog/ /blog/').join('/blog/');
        fs.writeFileSync(fullPath, content, 'utf8');
        fixes++;
    }
  });

  console.log(`\n🎉 Repair Complete: ${fixes} internal links sanitized.`);
}

repairMarkdownLinks();