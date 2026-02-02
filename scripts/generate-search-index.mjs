/* scripts/generate-search-index.mjs — NATIVE INDEXER */
import fs from 'fs';
import path from 'path';

const targetDir = 'content/downloads';

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) results = results.concat(getFiles(file));
    else if (file.endsWith('.mdx')) results.push(file);
  });
  return results;
}

console.log("🛠️ Building Global Search Index...");
const files = getFiles(targetDir);
const searchIndex = files.map(file => {
  const content = fs.readFileSync(file, 'utf8');
  const titleMatch = content.match(/title:\s*["'](.*)["']/);
  return {
    title: titleMatch ? titleMatch[1] : path.basename(file),
    slug: file.replace(/\\/g, '/').replace('content/', '').replace('.mdx', '')
  };
});

const output = path.join(process.cwd(), 'public', 'search-index.json');
fs.writeFileSync(output, JSON.stringify(searchIndex));
console.log("✅ Search Index Live.");