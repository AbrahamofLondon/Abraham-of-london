// scripts/check-content-boundary.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

// Only scan these folders (adjust if needed)
const SCAN_DIRS = ["pages", "lib", "components", "hooks", "netlify", "scripts"];

// Anything importing these is bypassing the boundary
const FORBIDDEN = [
  "contentlayer/generated",
  ".contentlayer/generated",
  "@/lib/contentlayer-generated",
  "@/lib/contentlayer-compat",
  "@/lib/contentlayer-helper",
  "@/lib/contentlayer", // (if you keep this file, it must re-export from "@/lib/content" only)
];

const ALLOWLIST_PATH_PREFIX = [
  path.join(ROOT, "lib", "content"), // boundary is allowed to touch internals via compat
  path.join(ROOT, "lib", "contentlayer-compat.ts"),
  path.join(ROOT, "lib", "contentlayer-generated.ts"),
];

function isAllowedFile(absPath) {
  return ALLOWLIST_PATH_PREFIX.some((p) => absPath.startsWith(p));
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function isCodeFile(f) {
  return f.endsWith(".ts") || f.endsWith(".tsx") || f.endsWith(".js") || f.endsWith(".jsx") || f.endsWith(".mjs") || f.endsWith(".cjs");
}

const offenders = [];

for (const d of SCAN_DIRS) {
  const absDir = path.join(ROOT, d);
  for (const file of walk(absDir)) {
    if (!isCodeFile(file)) continue;
    if (isAllowedFile(file)) continue;

    const txt = fs.readFileSync(file, "utf8");

    for (const bad of FORBIDDEN) {
      // Cheap, effective. We’re policing imports, not parsing AST.
      if (txt.includes(`from "${bad}"`) || txt.includes(`from '${bad}'`) || txt.includes(`require("${bad}")`) || txt.includes(`require('${bad}')`)) {
        offenders.push({ file, bad });
      }
    }
  }
}

if (offenders.length) {
  console.error("\n❌ Content boundary violation(s):\n");
  for (const o of offenders) {
    console.error(`- ${path.relative(ROOT, o.file)}  imports  ${o.bad}`);
  }
  console.error("\nFix: replace those imports with:  import { ... } from \"@/lib/content\" \n");
  process.exit(1);
}

console.log("✅ Content boundary check passed.");