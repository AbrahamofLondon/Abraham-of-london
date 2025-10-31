// scripts/audit-print-slugs.mjs
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const roots = [
  path.join(process.cwd(), "content", "print"),
  path.join(process.cwd(), "content", "downloads"), // if print lives here
  path.join(process.cwd(), "content"),               // safety sweep
];

const mdxFiles = [];
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) stack.push(p);
      else if (f.endsWith(".md") || f.endsWith(".mdx")) mdxFiles.push(p);
    }
  }
}

const rows = [];
for (const file of mdxFiles) {
  const raw = fs.readFileSync(file, "utf8");
  const { data } = matter(raw);
  // slug priority: frontmatter.slug → filename
  const slug = String(data.slug ?? path.basename(file).replace(/\.(mdx|md)$/i, ""))
    .trim()
    .toLowerCase();
  const isPrint = data?.type === "print" || /\/print\//.test(file) || data?.layout === "print";
  if (isPrint) rows.push({ slug, file });
}

const index = new Map();
for (const r of rows) {
  if (!index.has(r.slug)) index.set(r.slug, []);
  index.get(r.slug).push(r.file);
}

let dupes = 0;
for (const [slug, files] of index.entries()) {
  if (files.length > 1) {
    dupes++;
    console.log(`❌ DUPLICATE: ${slug}`);
    files.forEach(f => console.log(`   - ${f}`));
  }
}
if (!dupes) console.log("✅ No duplicate print slugs found.");
if (dupes) process.exitCode = 1;
