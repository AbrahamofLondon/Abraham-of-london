// scripts/audit-links.mjs — Link Integrity Audit (Pages Router + MDX)
// Run: node scripts/audit-links.mjs

import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function exists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

function checkPagesRoute(route) {
  const clean = route.replace(/^\//, "");
  const a = path.join(ROOT, "pages", clean, "index.tsx");
  const b = path.join(ROOT, "pages", `${clean}.tsx`);
  const c = path.join(ROOT, "pages", clean, "[slug].tsx");
  const d = path.join(ROOT, "pages", clean, "[...slug].tsx");
  return exists(a) || exists(b) || exists(c) || exists(d);
}

function listRoutes() {
  // validate that each “section root” exists as either index.tsx or dynamic route
  return [
    "/blog",
    "/strategy",
    "/downloads",
    "/resources",
    "/prints",
    "/events",
    "/shorts",
    "/books",
    "/canon",
    "/vault",
    "/content",
  ];
}

function main() {
  const missing = [];
  for (const r of listRoutes()) {
    if (!checkPagesRoute(r)) {
      missing.push(
        `Missing route handler for ${r} (expected pages/${r}/index.tsx OR pages/${r}/[slug].tsx OR pages/${r}/[...slug].tsx OR pages/${r}.tsx)`
      );
    }
  }

  if (missing.length) {
    console.error("\n❌ LINK AUDIT FAILED:");
    for (const m of missing) console.error(" -", m);
    process.exit(1);
  }

  console.log("✅ LINK AUDIT PASSED: core route handlers exist.");
}

main();