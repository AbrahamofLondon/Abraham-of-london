// scripts/pdf/list-pdfs.ts
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DOWNLOADS_ROOT = path.join(ROOT, "public", "assets", "downloads");

const EXT_ALLOW = new Set([".pdf", ".zip"]);

function walkFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const out: string[] = [];
  const stack = [root];

  while (stack.length) {
    const dir = stack.pop()!;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(abs);
      else out.push(abs);
    }
  }
  return out;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"] as const;
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  const digits = unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(digits)} ${units[unitIndex]}`;
}

function main() {
  if (!fs.existsSync(DOWNLOADS_ROOT)) {
    console.error(`Missing: ${DOWNLOADS_ROOT}`);
    process.exit(1);
  }

  const files = walkFiles(DOWNLOADS_ROOT)
    .filter((abs) => EXT_ALLOW.has(path.extname(abs).toLowerCase()))
    .filter((abs) => path.basename(abs).toLowerCase() !== "pdf-manifest.json")
    .filter((abs) => path.basename(abs).toLowerCase() !== "pdf-duplicates.json");

  files.sort((a, b) => a.localeCompare(b));

  console.log(`Downloads root: ${DOWNLOADS_ROOT}`);
  console.log(`Total files: ${files.length}\n`);

  for (const abs of files) {
    const rel = path.relative(path.join(ROOT, "public"), abs).replace(/\\/g, "/");
    const st = fs.statSync(abs);
    console.log(`${formatBytes(st.size).padStart(9)}  /${rel}`);
  }
}

main();
export default main;