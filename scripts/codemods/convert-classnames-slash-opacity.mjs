// scripts/codemods/convert-classnames-slash-opacity.mjs
// Rewrites slash-opacity utilities inside class strings to arbitrary color utilities.
// Handles: bg|text|border|ring|fill|stroke|outline|from|via|to|shadow
// Files: .{js,jsx,ts,tsx,md,mdx}
import fs from 'node:fs';
import path from 'node:path';

const roots = ['app','src','pages','components','content'];
const exts = new Set(['.js','.jsx','.ts','.tsx','.md','.mdx']);

const TOKEN_TO_VAR = {
  forest: '--color-primary',
  cream: '--color-on-primary',
  deepCharcoal: '--color-on-secondary',
  accent: '--color-accent',
  primary: '--color-primary',
  'on-primary': '--color-on-primary',
  'on-secondary': '--color-on-secondary',
  secondary: '--color-secondary',
};

const UTILITIES = ['bg','text','border','ring','fill','stroke','outline','from','via','to','shadow'];
const tokenGroup = Object.keys(TOKEN_TO_VAR).sort((a,b)=>b.length-a.length).map(x=>x.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')).join('|');
const utilGroup = UTILITIES.join('|');

// Match tokens within typical class attributes/strings
const re = new RegExp(`\\b(${utilGroup})-(${tokenGroup})\\/(\\d{1,3})\\b`, 'g');

function pctToDec(p) {
  const n = Math.max(0, Math.min(100, parseInt(p,10)||0));
  if (n === 0) return '0';
  if (n === 100) return '1';
  return (n/100).toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
}

function rewrite(util, token, pct) {
  const cssVar = TOKEN_TO_VAR[token] || '--color-primary';
  const dec = pctToDec(pct);
  if (util === 'shadow') return `shadow-[color:var(${cssVar})/${dec}]`;
  return `${util}-[color:var(${cssVar})/${dec}]`;
}

function convert(content) {
  return content.replace(re, (_, util, token, pct) => rewrite(util, token, pct));
}

function* walk(dir) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (exts.has(path.extname(e.name))) yield p;
  }
}

let files = 0, changed = 0, hits = 0;
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const f of walk(root)) {
    files++;
    const src = fs.readFileSync(f, 'utf8');
    const count = (src.match(re) || []).length;
    if (!count) continue;
    const out = convert(src);
    if (out !== src) {
      fs.writeFileSync(f, out, 'utf8');
      changed++; hits += count;
      console.log(`✔ Rewrote ${count} token(s) in ${f}`);
    }
  }
}
console.log(`\nDone. Scanned ${files} files. Replaced ${hits} token(s) across ${changed} file(s).`);
