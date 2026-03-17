// scripts/pdf/render-epub.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

function abs(p: string) {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

async function main() {
  const slug = process.argv[2];
  if (!slug) throw new Error("Missing slug");

  const src = abs(`scripts/pdf/print-sources/${slug}.print.md`);
  const out = abs(`public/assets/downloads/${slug}.epub`);

  if (!fs.existsSync(src)) {
    throw new Error(`Missing source: ${src}`);
  }

  const raw = fs.readFileSync(src, "utf8");
  const parsed = matter(raw);

  // Placeholder for actual EPUB pipeline
  fs.writeFileSync(
    out,
    `EPUB placeholder for: ${parsed.data.title || slug}`,
    "utf8",
  );

  console.log(`✅ EPUB written: ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});