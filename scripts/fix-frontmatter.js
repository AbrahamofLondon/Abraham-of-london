// scripts/fix-frontmatter.js (ES Module version)
// Usage:
//   node scripts/fix-frontmatter.js           -> dry run (prints what would change)
//   node scripts/fix-frontmatter.js --write   -> applies changes and writes .bak backups

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'content', 'blog');
const BOOKS_DIR = path.join(ROOT, 'content', 'books');
const PUBLIC_BLOG = path.join(ROOT, 'public', 'images', 'blog');
const PUBLIC_BOOKS = path.join(ROOT, 'public', 'images', 'books');
const WRITE = process.argv.includes('--write');

function filesIn(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => /\.mdx?$/.test(f));
}

function toArray(v) {
  if (!v && v !== 0) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  return [String(v)].filter(Boolean);
}

function firstExisting(...candidates) {
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

function repairBlogCover(slug, existing) {
  // Your blog covers live in /public/images/blog/*
  // Keep existing if it already points there or is a valid absolute/remote path
  if (typeof existing === 'string' && (existing.startsWith('/images/blog/') || existing.startsWith('http'))) {
    return existing;
  }
  // Try common extensions by slug
  const hit = firstExisting(
    path.join(PUBLIC_BLOG, `${slug}.jpg`),
    path.join(PUBLIC_BLOG, `${slug}.jpeg`),
    path.join(PUBLIC_BLOG, `${slug}.webp`),
    path.join(PUBLIC_BLOG, `${slug}.png`)
  );
  if (hit) {
    return `/images/blog/${path.basename(hit)}`;
  }
  // Fallback to your default blog cover (you have it in /public/images/blog)
  return '/images/blog/default-blog-cover.jpg';
}

function repairBookCover(slug, existing) {
  // Your book covers folder + default asset
  if (typeof existing === 'string' && (existing.startsWith('/images/books/') || existing.startsWith('http'))) {
    return existing;
  }
  const hit = firstExisting(
    path.join(PUBLIC_BOOKS, `${slug}.jpg`),
    path.join(PUBLIC_BOOKS, `${slug}.jpeg`),
    path.join(PUBLIC_BOOKS, `${slug}.webp`),
    path.join(PUBLIC_BOOKS, `${slug}.png`)
  );
  if (hit) {
    return `/images/books/${path.basename(hit)}`;
  }
  // Your site-wide default book image lives under /assets/images
  return '/assets/images/default-book.jpg';
}

function normalizeDate(d1, d2) {
  // prefer ISO strings; if none, return empty string
  const val = d1 || d2 || '';
  if (!val) return '';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toISOString().slice(0, 10);
  } catch {
    return String(val);
  }
}

function processDir(dir, type) {
  const files = filesIn(dir);
  if (!files.length) {
    console.log(`(i) No MDX in ${dir}`);
    return;
  }

  console.log(`\n== ${type.toUpperCase()} ==`);
  files.forEach((fname) => {
    const full = path.join(dir, fname);
    const raw = fs.readFileSync(full, 'utf8');
    const parsed = matter(raw);
    const slug = fname.replace(/\.(mdx|md)$/i, '');

    const data = { ...parsed.data };
    const before = JSON.stringify(data);

    // Normalize common fields
    data.slug = data.slug || slug;
    data.title = data.title || (type === 'blog' ? 'Untitled Post' : 'Untitled Book');
    data.author = data.author || 'Abraham of London';
    data.excerpt = data.excerpt || '';
    data.date = normalizeDate(data.date, data.publishedAt);
    data.publishedAt = data.date || normalizeDate(data.publishedAt, data.date);
    data.tags = toArray(data.tags);
    data.genre = toArray(data.genre);

    if (type === 'blog') {
      data.coverImage = repairBlogCover(slug, data.coverImage);
      data.readTime = data.readTime || '5 min read';
      data.category = data.category || 'General';
    } else {
      data.coverImage = repairBookCover(slug, data.coverImage);
      data.buyLink = data.buyLink || '#';
      data.downloadPdf = data.downloadPdf ?? null;
      data.downloadEpub = data.downloadEpub ?? null;
      data.description = data.description || data.excerpt || '';
    }

    const after = JSON.stringify(data);
    if (before !== after) {
      console.log(`‚¬ ${type}:${fname} -> normalized`);
      if (WRITE) {
        fs.writeFileSync(`${full}.bak`, raw, 'utf8');
        const out = matter.stringify(parsed.content, data);
        fs.writeFileSync(full, out, 'utf8');
      }
    } else {
      console.log(`‚¬ ${type}:${fname} -> ok`);
    }
  });
}

processDir(BLOG_DIR, 'blog');
processDir(BOOKS_DIR, 'books');

if (!WRITE) {
  console.log('\nDry run complete. Use --write to apply changes and create .bak backups.');
}
