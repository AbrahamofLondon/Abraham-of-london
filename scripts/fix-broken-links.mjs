import fs from 'fs';
import path from 'path';

const contentDir = path.resolve('./content');

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

function repairMarkdownLinks() {
  const files = getAllFiles(contentDir);
  let filesModified = 0;
  let totalLinksFixed = 0;

  console.log(`\n--- 🛡️ Surgical Link Repair: Sanitizing Markdown Bodies ---`);

  files.forEach(fullPath => {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // Regex Explanation:
    // Captures: (/folder/ /folder/slug) or (/folder/ /folder/slug)
    // Works for: /blog/, /lexicon/, /briefs/, /vault/
    const brokenLinkRegex = /\(\/([^/]+)\/\s+\/\1\/([^)]+)\)/g;

    // 1. Apply Regex Repair
    content = content.replace(brokenLinkRegex, (match, folder, slug) => {
      totalLinksFixed++;
      return `(/${folder}/${slug})`;
    });

    // 2. Global String Replacement for stubborn artifacts
    const artifacts = ['/blog/ /blog/', '/lexicon/ /lexicon/', '/briefs/ /briefs/'];
    artifacts.forEach(artifact => {
      if (content.includes(artifact)) {
        const replacement = artifact.split(' ')[0]; // Takes the first half
        const count = content.split(artifact).length - 1;
        content = content.split(artifact).join(replacement);
        totalLinksFixed += count;
      }
    });

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Repaired: ${path.relative(contentDir, fullPath)}`);
      filesModified++;
    }
  });

  console.log(`\n--- 📊 Repair Summary ---`);
  console.log(`📂 Files Modified: ${filesModified}`);
  console.log(`🔗 Total Links Sanitized: ${totalLinksFixed}`);
  console.log(`---------------------------\n`);
}

repairMarkdownLinks();