scripts/generate-download-stubs.mjs
import fs from "node:fs";
import path from "node:path";

const PUBLIC_DIR = path.join(process.cwd(), "public", "downloads");
const OUT_DIR = path.join(process.cwd(), "content", "downloads");

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const file of fs.readdirSync(PUBLIC_DIR)) {
  if (!file.toLowerCase().endsWith(".pdf")) continue;

  const slug = slugify(file);
  const outPath = path.join(OUT_DIR, `${slug}.mdx`);
  if (fs.existsSync(outPath)) continue;

  const title = file.replace(/[_-]+/g, " ").replace(/\.pdf$/i, "");
  const mdx = `---
slug: ${slug}
title: "${title}"
summary: ""
file: "/downloads/${file}"
category: "Library"
tags: []
---

<!-- Add a 1–2-line description here. -->
`;

  fs.writeFileSync(outPath, mdx, "utf8");
  console.log("Created:", outPath);
}
