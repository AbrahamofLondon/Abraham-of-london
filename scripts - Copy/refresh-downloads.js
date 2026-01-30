// scripts/refresh-downloads.js (ESM - compatible with "type": "module")

import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const DOWNLOADS_DIR = path.join(PUBLIC_DIR, "downloads");

// You can change this output if your code expects a different path.
// This is safe: it won't break builds even if nothing reads it yet.
const OUTPUT = path.join(ROOT, "content", "downloads", "_generated.downloads.json");

const ALLOWED_EXT = new Set([
  ".pdf",
  ".zip",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
]);

function sha1(input) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

function toWebPath(absPath) {
  const rel = path.relative(PUBLIC_DIR, absPath);
  return "/" + rel.split(path.sep).join("/");
}

async function main() {
  if (!(await exists(DOWNLOADS_DIR))) {
    console.warn(`⚠️ No downloads folder found: ${DOWNLOADS_DIR}`);
    process.exit(0);
  }

  const files = await walk(DOWNLOADS_DIR);

  const assets = files
    .filter((f) => ALLOWED_EXT.has(path.extname(f).toLowerCase()))
    .map((f) => {
      const webPath = toWebPath(f);
      return {
        id: sha1(webPath),
        filename: path.basename(f),
        path: webPath,
        ext: path.extname(f).toLowerCase(),
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(
    OUTPUT,
    JSON.stringify({ generatedAt: new Date().toISOString(), assets }, null, 2),
    "utf8"
  );

  console.log(`✅ refresh:downloads wrote ${assets.length} assets → ${OUTPUT}`);
}

main().catch((err) => {
  console.error("❌ refresh:downloads failed:", err);
  process.exit(1);
});
