// scripts/scaffold-download-sources.mjs
// Auto-discovers suspicious PDFs and scaffolds MD sources so make-pdfs can render premium, branded versions.
// Usage: node scripts/scaffold-download-sources.mjs [--force]

import fs from "node:fs/promises";
import fss from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = new URL("..", import.meta.url).pathname;
const PUB = path.join(ROOT, "public", "downloads");
const OUT = path.join(ROOT, "content", "downloads");

const FORCE = process.argv.includes("--force");
const SMALL_BYTES = 10 * 1024;

const titleCase = (s) =>
  s.replace(/[-_]+/g, " ")
    .replace(/\b[a-z]/g, (m) => m.toUpperCase())
    .replace(/\bA4\b/gi, "A4")
    .replace(/\bA6\b/gi, "A6");

const toSlug = (file) =>
  file
    .replace(/\.pdf$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const kebab = (file) =>
  file
    .replace(/\.pdf$/i, "")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase() + ".pdf";

const TEMPLATE = (title, file, excerpt) => `---
title: ${title}
author: Abraham of London
date: ${new Date().toISOString().slice(0,10)}
excerpt: ${excerpt}
pdfFileName: ${file}
coverImage: /assets/images/downloads/${file.replace(/\.pdf$/i,"")}.jpg
---

# ${title}

_Replace this scaffold with final copy. This source allows automated, branded PDF rendering via Puppeteer._
`;

const BAD_STYLE = (name) =>
  !/^([a-z0-9]+(?:-[a-z0-9]+)*)\.pdf$/.test(name) && // kebab-case
  !/^([A-Z][A-Za-z0-9]+)(?:_[A-Z][A-Za-z0-9]+)*\.pdf$/.test(name); // Title_Case_With_Underscores.pdf

async function main() {
  if (!fss.existsSync(PUB)) {
    console.log("No /public/downloads to scan.");
    return;
  }
  await fs.mkdir(OUT, { recursive: true });

  const files = (await fs.readdir(PUB)).filter((f) => /\.pdf$/i.test(f));
  const picks = [];
  for (const f of files) {
    const p = path.join(PUB, f);
    const stat = await fs.stat(p).catch(() => null);
    if (!stat) continue;
    const isSmall = stat.size < SMALL_BYTES;
    const styleBad = BAD_STYLE(f);
    if (isSmall || styleBad) picks.push({ name: f, size: stat.size, isSmall, styleBad });
  }

  if (picks.length === 0) {
    console.log("✅ No suspicious PDFs. Nothing to scaffold.");
    return;
  }

  for (const it of picks) {
    const slug = toSlug(it.name);
    const mdPath = path.join(OUT, `${slug}.md`);
    const prettyTitle = titleCase(slug);
    const suggested = kebab(it.name);
    const excerpt = `${prettyTitle} — a concise, practical resource.`;

    if (!FORCE && fss.existsSync(mdPath)) {
      console.log("• exists, skipping:", path.relative(ROOT, mdPath));
      continue;
    }

    await fs.writeFile(mdPath, TEMPLATE(prettyTitle, suggested, excerpt), "utf8");
    console.log("✍️  scaffolded:", path.relative(ROOT, mdPath));
  }

  // Optional: emit a manifest hash to track changes
  const manifest = JSON.stringify(picks, null, 2);
  const hash = crypto.createHash("sha1").update(manifest).digest("hex").slice(0, 8);
  await fs.writeFile(path.join(OUT, `.scaffold-manifest-${hash}.json`), manifest, "utf8");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
