// scripts/replace-contentlayer-imports.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const dirs = ["pages", "lib", "components", "hooks"];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(f));
    else out.push(f);
  }
  return out;
}

const files = dirs
  .flatMap((d) => walk(path.join(ROOT, d)))
  .filter((f) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f));

const replacements = [
  ['from "@/lib/content"', 'from "@/lib/content"'],
  ["from '@/lib/contentlayer-compat'", "from '@/lib/content'"],

  ['from "@/lib/contentlayer-helper"', 'from "@/lib/content"'],
  ["from '@/lib/contentlayer-helper'", "from '@/lib/content'"],

  ['from "@/lib/contentlayer"', 'from "@/lib/content"'],
  ["from '@/lib/contentlayer'", "from '@/lib/content'"],

  // also catch legacy direct generated imports if any
  ['from "contentlayer/generated"', 'from "@/lib/content"'],
  ["from 'contentlayer/generated'", "from '@/lib/content'"],
];

let changed = 0;

for (const f of files) {
  const before = fs.readFileSync(f, "utf8");
  let after = before;

  for (const [a, b] of replacements) after = after.split(a).join(b);

  if (after !== before) {
    fs.writeFileSync(f, after, "utf8");
    changed++;
  }
}

console.log(`Updated files: ${changed}`);
