import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

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

function bruteRepair() {
  const files = getAllFiles(contentDir);
  let slugFixes = 0;

  console.log(`\n--- 🛡️  Institutional Brute-Force Repair: ${files.length} Briefs ---`);

  files.forEach(fullPath => {
    const relativeToContent = path.relative(contentDir, fullPath);
    // Get the folder name (e.g., 'shorts') correctly regardless of OS slashes
    const category = path.dirname(relativeToContent).split(path.sep)[0];
    
    let rawContent = fs.readFileSync(fullPath, 'utf8');
    const parts = rawContent.split('---');

    if (parts.length < 3) return; // Skip files without proper frontmatter

    try {
      let data = yaml.load(parts[1]);

      // Check if slug needs repair (missing leading slash or missing category)
      if (data && data.slug) {
        const currentSlug = String(data.slug);
        const requiredPrefix = `/${category}/`;

        if (!currentSlug.startsWith(requiredPrefix)) {
          // Strip any leading slashes/quotes and rebuild correctly
          const cleanSlug = currentSlug.replace(/^["'/]+/, '');
          data.slug = `/${category}/${cleanSlug}`.replace(/\/+/g, '/');
          
          // Reconstruct the file
          const newYaml = yaml.dump(data);
          const newContent = `---\n${newYaml}---${parts.slice(2).join('---')}`;
          
          fs.writeFileSync(fullPath, newContent, 'utf8');
          slugFixes++;
          console.log(`✅ Fixed: ${relativeToContent} -> ${data.slug}`);
        }
      }
    } catch (e) {
      console.error(`❌ Parse Error in ${relativeToContent}: ${e.message}`);
    }
  });

  console.log(`\n--- 🏗️  Repair Complete: ${slugFixes} slugs updated. ---`);
}

bruteRepair();