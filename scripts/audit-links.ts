// scripts/audit-links.ts — Link Integrity Audit (Pages Router + MDX)
// Run: node scripts/audit-links.ts
import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function exists(p: string) {
  try { return fs.existsSync(p); } catch { return false; }
}

function listRoutes(): Set<string> {
  // Basic pages-router routes that matter for MDX
  // We only verify "collection root pages" exist, since [slug].tsx handles children.
  const expected = [
    "/blog",
    "/strategy",
    "/downloads",
    "/resources",
    "/prints",
    "/events",
    "/shorts",
    "/books",
    "/canon",
  ];

  return new Set(expected);
}

function checkPagesRoute(route: string): boolean {
  // /blog -> pages/blog/index.tsx or pages/blog.tsx
  const clean = route.replace(/^\//, "");
  const a = path.join(ROOT, "pages", clean, "index.tsx");
  const b = path.join(ROOT, "pages", `${clean}.tsx`);
  return exists(a) || exists(b);
}

async function main() {
  const missing: string[] = [];

  const routes = listRoutes();
  for (const r of routes) {
    if (!checkPagesRoute(r)) missing.push(`Missing route page for ${r} (expected pages/${r}/index.tsx or pages/${r}.tsx)`);
  }

  if (missing.length) {
    console.error("\n❌ LINK AUDIT FAILED:");
    missing.forEach((m) => console.error(" -", m));
    process.exit(1);
  }

  console.log("✅ LINK AUDIT PASSED: core routes exist.");
}

main().catch((e) => {
  console.error("❌ audit-links crashed:", e);
  process.exit(1);
});