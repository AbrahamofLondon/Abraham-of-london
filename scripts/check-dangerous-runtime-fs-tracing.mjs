import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const ROUTES = [
  "pages/downloads/[...slug].tsx",
  "pages/api/downloads/resolve/[slug].ts",
  "pages/api/downloads/resolve/[slug]/[...rest].ts",
  "pages/api/private/vault/[...path].ts",
  "app/api/downloads/[slug]/route.ts",
];

const FORBIDDEN = [
  { label: "process.cwd()", pattern: /process\.cwd\s*\(/ },
  { label: "readdirSync", pattern: /\breaddirSync\b/ },
  { label: "glob", pattern: /\bglob(?:Sync)?\b/ },
  { label: "private_storage", pattern: /private_storage/ },
  { label: "video/", pattern: /video\// },
  { label: ".next/cache", pattern: /\.next\/cache/ },
  {
    label: "path.join(process.cwd(), \"public\")",
    pattern: /path\.join\s*\(\s*process\.cwd\s*\(\s*\)\s*,\s*["']public["']/,
  },
  {
    label: "path.join(process.cwd(), \"private_storage\")",
    pattern: /path\.join\s*\(\s*process\.cwd\s*\(\s*\)\s*,\s*["']private_storage["']/,
  },
  { label: "recursive file discovery", pattern: /\brecursive\b|\bwalk(?:Dir|Directory)?\b/ },
];

let failures = 0;

for (const route of ROUTES) {
  const absolute = path.join(ROOT, route);
  if (!fs.existsSync(absolute)) {
    console.error(`[TRACE_GUARD] Missing route: ${route}`);
    failures += 1;
    continue;
  }

  const source = fs.readFileSync(absolute, "utf8");
  for (const rule of FORBIDDEN) {
    if (!rule.pattern.test(source)) continue;
    console.error(`[TRACE_GUARD] ${route} contains forbidden runtime tracing pattern: ${rule.label}`);
    failures += 1;
  }
}

if (failures > 0) {
  console.error(`[TRACE_GUARD] Failed with ${failures} issue(s). Use manifest lookup and redirects only.`);
  process.exit(1);
}

console.log("[TRACE_GUARD] OK - download and vault routes are manifest-only.");
