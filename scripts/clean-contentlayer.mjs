import fs from "fs";
import path from "path";

const targets = [
  ".contentlayer",
  ".contentlayer-cache",
  ".cache/contentlayer",
  "node_modules/.cache/contentlayer",
];

function rmrf(p) {
  try {
    fs.rmSync(p, { recursive: true, force: true });
  } catch {}
}

for (const t of targets) {
  rmrf(path.resolve(process.cwd(), t));
  console.log(`[CLEAN] removed ${t}`);
}