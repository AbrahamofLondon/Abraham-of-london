// scripts/validate-post-images.mjs
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import glob from 'glob';

const ROOT = process.cwd();
const POSTS = glob.sync('content/blog/**/*.{md,mdx}', { cwd: ROOT, nodir: true });
const missing = [];

for (const file of POSTS) {
  const raw = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const { data } = matter(raw);
  const fields = ['cover', 'image', 'hero', 'thumbnail'];
  for (const key of fields) {
    const v = data?.[key];
    if (!v || typeof v !== 'string') continue;
    // only verify local public assets
    if (!v.startsWith('/')) continue;
    const abs = path.join(ROOT, 'public', v.replace(/^\//, ''));
    if (!fs.existsSync(abs)) {
      missing.push({ post: file, field: key, value: v });
    }
  }
}

if (missing.length) {
  console.error('\nMissing post images:\n');
  for (const m of missing) {
    console.error(`- ${m.post}: ${m.field} → ${m.value} (no file at public${m.value})`);
  }
  console.error('\nFix the paths (name, folder, extension, and case) and commit.');
  process.exit(1);
} else {
  console.log('✓ All referenced post images exist.');
}
