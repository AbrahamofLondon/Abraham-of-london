import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const contentDir = path.resolve('./content');
const manifestPath = path.resolve('./vault-manifest.json');

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

function build() {
  console.log('--- 🏗️  Building Institutional Manifest ---');
  const files = getAllFiles(contentDir);
  const manifest = [];

  files.forEach(fullPath => {
    try {
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const parts = fileContent.split('---');
      if (parts.length >= 3) {
        const data = yaml.load(parts[1]);
        if (data && data.slug) {
          manifest.push({
            title: data.title || 'Untitled',
            slug: data.slug.trim(),
            file: path.relative(process.cwd(), fullPath)
          });
        }
      }
    } catch (e) {
      console.error(`❌ Error parsing ${fullPath}: ${e.message}`);
    }
  });

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✅ Success: ${manifest.length} briefs indexed in vault-manifest.json`);
}

build();