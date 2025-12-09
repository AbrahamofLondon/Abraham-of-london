// scripts/prevent-pages-router.js
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const pagesDir = path.join(ROOT, "pages");
const isApiPath = (fp) => fp.split(path.sep).includes("api");

function collectPages(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];

  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      const rel = path.relative(ROOT, full);

      if (rel.startsWith("node_modules") || rel.startsWith(".next")) continue;
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!/\.tsx?$/.test(entry.name)) continue;

      const base = path.basename(entry.name);
      if (base === "_app.tsx" || base === "_document.tsx") continue;
      if (isApiPath(rel)) continue;

      out.push(rel);
    }
  }
  return out;
}

const offenders = collectPages(pagesDir);

if (offenders.length > 0) {
  console.error(
    "\n🚫 Build blocked: Pages Router files detected (App Router is enforced).\n" +
      offenders.map((f) => " - " + f).join("\n") +
      "\n\n➡ Remove these files or migrate them under /app/.\n"
  );
  process.exit(1);
}

console.log("✅ App Router enforced: no legacy /pages routes detected.");
