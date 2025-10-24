#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const out = "scripts/_reports/asset-inventory.json";
const folders = [
  "public/assets/images/blog",
  "public/assets/images/events",
  "public/downloads",
  "public/resources"
];

function list(dir) {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else out.push(p);
    }
  })(dir);
  return out;
}

const inv = {};
for (const f of folders) {
  if (!fs.existsSync(f)) continue;
  inv[f] = list(f).map(p => p.replaceAll("\\", "/"));
}
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(inv, null, 2));
console.log("📦 Asset snapshot →", out);
