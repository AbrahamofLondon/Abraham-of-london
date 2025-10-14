// File: scripts/convert-tailwind-slash-opacity.mjs
// (identical to the last version I gave you — ensure this exact filename, not .txt)
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const flags = new Set(argv.filter(a => a.startsWith('--')));
const CHECK_MODE = flags.has('--check');
const ROOTS_CSV = (argv.find(a => a.startsWith('--paths=')) || '').split('=').slice(1).join('=') || '';
const ROOTS = (ROOTS_CSV ? ROOTS_CSV.split(',') : ['app', 'src', 'pages', 'components', 'content', 'lib', 'styles'])
  .map(s => s.trim()).filter(Boolean);

const exts = new Set(['.js', '.ts', '.jsx', '.tsx', '.md', '.mdx', '.css', '.html']);

const colorVarMap = {
  forest: '--color-primary',
  cream: '--color-on-primary',
  deepCharcoal: '--color-on-secondary',
  accent: '--color-accent',
  primary: '--color-primary',
  'on-primary': '--color-on-primary',
  'on-secondary': '--color-on-secondary',
  secondary: '--color-secondary'
};

const utilities = ['bg', 'text', 'border', 'ring', 'fill', 'stroke', 'outline', 'from', 'via', 'to', 'shadow'];

const tokenGroup = Object.keys(colorVarMap).sort((a, b) => b.length - a.length)
  .map(t => t.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
const utilGroup = utilities.join('|');
const regex = new RegExp(`\\b(${utilGroup})-(${tokenGroup})\\/(\\d{1,3})\\b`, 'g');

function pctToDec(p) {
  let n = parseInt(p, 10);
  if (!Number.isFinite(n)) n = 0;
  n = Math.max(0, Math.min(100, n));
  if (n === 100) return '1';
  if (n === 0) return '0';
  return (n / 100).toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
}

function convertOne(match, util, token, pct) {
  const cssVar = colorVarMap[token];
  if (!cssVar) return match;
  const dec = pctToDec(pct);
  if (util === 'shadow') return `shadow-[color:var(${cssVar})/${dec}]`;
  return `${util}-[color:var(${cssVar})/${dec}]`;
}

function convertContent(src) { return src.replace(regex, convertOne); }

function* walk(dir) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (exts.has(path.extname(e.name))) yield p;
  }
}

let scanned = 0, changedFiles = 0, changedTokens = 0;
const changes = [];
for (const root of ROOTS) {
  if (!fs.existsSync(root)) continue;
  for (const file of walk(root)) {
    scanned++;
    const src = fs.readFileSync(file, 'utf8');
    const matches = [...src.matchAll(regex)];
    if (matches.length === 0) continue;
    const out = convertContent(src);
    if (out !== src) {
      changedFiles++;
      changedTokens += matches.length;
      if (CHECK_MODE) changes.push({ file, hits: matches.length });
      else { fs.writeFileSync(file, out, 'utf8'); console.log(`✔ Rewrote ${matches.length} token(s) in ${file}`); }
    }
  }
}

if (CHECK_MODE) {
  if (changes.length) {
    console.log('— DRY RUN — would change:');
    for (const { file, hits } of changes) console.log(`• ${file} (+${hits})`);
    console.log(`Scanned ${scanned} files. Would replace ${changedTokens} token(s) across ${changedFiles} file(s).`);
    process.exit(1);
  } else {
    console.log(`No changes needed. Scanned ${scanned} files.`);
    process.exit(0);
  }
} else {
  console.log(`Done. Scanned ${scanned} files. Replaced ${changedTokens} token(s) across ${changedFiles} file(s).`);
  process.exit(0);
}
