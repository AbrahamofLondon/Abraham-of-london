// scripts/check-mdx-for-html.js (CommonJS, no external deps)
const fs = require('node:fs');
const path = require('node:path');

const START_DIRS = ['content', 'blog', 'posts'];
const IGNORE_DIRS = new Set(['node_modules', '.next', '.git', '.netlify', '.vscode', 'out', 'public']);

function isMdx(file) {
  return file.toLowerCase().endsWith('.mdx');
}

function scanFile(filePath, offenders) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('<!--') || line.includes('<!')) {
      hits.push(`${filePath}:${i + 1}: ${line.trim()}`);
    }
  }
  if (hits.length) offenders.push(...hits);
}

function walkDir(dir, offenders) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!IGNORE_DIRS.has(e.name)) walkDir(p, offenders);
    } else if (e.isFile() && isMdx(p)) {
      scanFile(p, offenders);
    }
  }
}

function main() {
  const offenders = [];
  let started = false;

  for (const d of START_DIRS) {
    if (fs.existsSync(d) && fs.statSync(d).isDirectory()) {
      walkDir(d, offenders);
      started = true;
    }
  }

  if (!started) walkDir(process.cwd(), offenders);

  if (offenders.length) {
    console.error('❌ HTML comments or `<!` found in MDX:\n' + offenders.join('\n'));
    process.exit(1);
  } else {
    console.log('✅ MDX looks clean.');
  }
}

main();
