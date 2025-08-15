// scripts/sanitize-source.js
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const EXT = new Set(['.ts', '.tsx', '.md', '.mdx']);

const IRREGULAR_WS = /[\u00A0\u1680\u180E\u2000-\u200A\u200B\u200C\u200D\u2028\u2029\u202F\u205F\u3000\uFEFF]/g;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.next') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (EXT.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

function sanitizeFile(file) {
  const buf = fs.readFileSync(file);
  let txt = buf.toString('utf8');

  const before = txt;
  // 1) strip BOM if present
  if (txt.charCodeAt(0) === 0xFEFF) txt = txt.slice(1);
  // 2) replace irregular whitespace with normal spaces
  txt = txt.replace(IRREGULAR_WS, ' ');
  // 3) collapse accidental triple spaces from replacements
  txt = txt.replace(/ {3,}/g, '  ');

  if (txt !== before) {
    fs.writeFileSync(file, txt, 'utf8');
    console.log('sanitized:', path.relative(ROOT, file));
  }
}

const files = walk(ROOT);
files.forEach(sanitizeFile);

console.log(`\nDone. Scanned ${files.length} files.`);
