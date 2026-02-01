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

function align() {
  const files = getAllFiles(contentDir);
  let fixed = 0;

  console.log(`\n--- 🛡️  Institutional Alignment: Resolving Blog & Resources ---`);

  files.forEach(fullPath => {
    const rel = path.relative(contentDir, fullPath);
    const folder = path.dirname(rel).split(path.sep)[0];
    let raw = fs.readFileSync(fullPath, 'utf8');
    const parts = raw.split('---');

    if (parts.length < 3) return;

    try {
      // Use yaml.load to get clean data, then yaml.dump to write it back
      let data = yaml.load(parts[1]);
      if (!data || !data.slug) return;

      const currentSlug = String(data.slug).trim();
      const slugName = currentSlug.split('/').pop().trim();
      
      let targetSlug;
      if (folder === 'lexicon') {
        targetSlug = `/vault/lexicon/${slugName}`;
      } else {
        targetSlug = `/${folder}/${slugName}`;
      }

      // Final sanitization: Remove double slashes and any invisible characters
      targetSlug = targetSlug.replace(/\/+/g, '/').replace(/\s+/g, '');

      if (currentSlug !== targetSlug) {
        data.slug = targetSlug;
        // Set indent to 2 for institutional standard YAML formatting
        const newYaml = yaml.dump(data, { indent: 2, lineWidth: -1 });
        fs.writeFileSync(fullPath, `---\n${newYaml}---${parts.slice(2).join('---')}`);
        console.log(`✅ Fixed: ${rel} -> ${targetSlug}`);
        fixed++;
      }
    } catch (e) {
      console.error(`❌ Parse Error ${rel}: ${e.message}`);
    }
  });

  console.log(`\n🎉 Process Complete: ${fixed} files aligned.`);
}

align();