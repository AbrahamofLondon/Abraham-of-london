// scripts/fix-missing-download-frontmatter.mjs
import path from "node:path";
import fsp from "node:fs/promises";
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
  console.log(`[fix-frontmatter] Scanning in: ${DL_DIR}`);
  const files = await glob(["**/*.mdx", "**/*.md"], { cwd: DL_DIR });
  
  if (!files.length) {
    console.log("[fix-frontmatter] No download MDX/MD files found.");
    return;
  }

  const report = { fixed: [], skipped: [] };

  for (const rel of files) {
    const abs = path.join(DL_DIR, rel);
    let raw;
    try {
      raw = await fsp.readFile(abs, "utf8");
    } catch (e) {
      console.error(`[fix-frontmatter] ERROR: Could not read file ${rel}: ${e.message}`);
      continue;
    }
    
    const parsed = matter(raw);
    const data = parsed.data || {}; // Ensure data is an object

    const base = path.basename(rel);
    const slugFromName = toSlug(base);
    const titleFromName = toTitleFromSlug(slugFromName);

    // Define all fields that MUST exist, using existing data or a fallback
    const requiredData = {
      title: data.title ?? titleFromName,
      slug: data.slug ?? slugFromName,
      date: data.date ?? todayISO(),
      author: data.author ?? "Abraham of London",
      readTime: data.readTime ?? "1 min",
      category: data.category ?? "Downloads",
      type: data.type ?? "pdf",
    };

    // Check if we actually changed anything by comparing old data to new data
    const changed = Object.entries(requiredData).some(
      ([key, value]) => data[key] !== value
    );

    if (changed) {
      // Re-serialize the file with all original data PLUS the required fallbacks
      const nextFrontmatter = { ...data, ...requiredData };
      const nextContent = matter.stringify(parsed.content || '', nextFrontmatter);
      await fsp.writeFile(abs, nextContent);
      report.fixed.push(rel);
    } else {
      report.skipped.push(rel);
    }
  }

  console.log("[fix-frontmatter] Report:");
  console.log(JSON.stringify(report, null, 2));
  console.log(`[fix-frontmatter] Done. Fixed ${report.fixed.length}, skipped ${report.skipped.length}.`);
}

main().catch((e) => {
  console.error("[fix-frontmatter] An unexpected error occurred:");
  console.error(e);
  process.exit(1);
});((e) => {
  console.error("[fix-frontmatter] An unexpected error occurred:");
  console.error(e);
  process.exit(1);
});