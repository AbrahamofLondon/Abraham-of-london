/* validate-mdx.mjs — NATIVE VALIDATOR */
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

console.log("🔍 Validating MDX Portfolio...");
const files = getFiles(targetDir);
let errors = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (/[“”‘’]/.test(content)) {
    console.warn(`⚠️ [SMART QUOTES] found in: ${file}`);
    // We won't block the build for this, just warn.
  }
});

console.log(`✅ Validation check finished for ${files.length} files.`);