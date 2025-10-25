// scripts/build-download-manifest.mjs
import fsp from "fs/promises";
import path from "path";
const ROOT = process.cwd();
const DL = path.join(ROOT, "public", "downloads");
const OUT = path.join(DL, "manifest.json");

const exts = new Set([".pdf", ".epub", ".zip"]);
const files = (await fsp.readdir(DL)).filter((f) =>
  exts.has(path.extname(f).toLowerCase()),
);
await fsp.writeFile(
  OUT,
  JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2),
);
console.log(`[manifest] wrote ${OUT} (${files.length} items)`);
