#!/usr/bin/env node
import path from "path";
import fsp from "fs/promises";
import glob from "fast-glob";
import matter from "gray-matter";

const ROOT = process.cwd();
const DL_DIR = path.join(ROOT, "content", "downloads");

function toSlug(basename) {
  // basename like "leadership-playbook.mdx" -> "leadership-playbook"
  return basename.replace(/\.mdx?$/i, "").trim().toLowerCase();
}
function toTitleFromSlug(slug) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

async function main() {
  const files = await glob(["**/*.mdx"], { cwd: DL_DIR });
  if (!files.length) {
    console.log("No download MDX files found.");
    return;
  }

  const report = { fixed: [], skipped: [] };

  for (const rel of files) {
    const abs = path.join(DL_DIR, rel);
    const raw = await fsp.readFile(abs, "utf8");
    const parsed = matter(raw);

    const base = path.basename(rel);
    const slugFromName = toSlug(base);
    const titleFromName = toTitleFromSlug(slugFromName);

    const need = {
      title: parsed.data.title ?? titleFromName,
      slug: parsed.data.slug ?? slugFromName,
      date: parsed.data.date ?? todayISO(),
      author: parsed.data.author ?? "Abraham of London",
      readTime: parsed.data.readTime ?? "1 min",
      category: parsed.data.category ?? "Downloads",
      type: parsed.data.type ?? "pdf",
      // keep everything else as-is
    };

    // Check if we actually changed anything
    const changed = Object.entries(need).some(([k, v]) => parsed.data[k] !== v);

    if (changed) {
      const next = matter.stringify(parsed.content, { ...parsed.data, ...need });
      await fsp.writeFile(abs, next);
      report.fixed.push(rel);
    } else {
      report.skipped.push(rel);
    }
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
