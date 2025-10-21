// scripts/probe-print-routes.mjs
#!/usr/bin/env node
import path from "path";
import fsp from "fs/promises";
import glob from "fast-glob";

const ROOT = process.cwd();
const PAGES_PRINT = path.join(ROOT, "pages", "print");

const SKIP = new Set([
  "_app", "_document", "_error"
]);

function toRoute(fp) {
  // pages/print/foo/bar.tsx -> /print/foo/bar
  const rel = fp.replace(/\\/g, "/").split("/pages/print/")[1];
  const noExt = rel.replace(/\.(js|jsx|ts|tsx|mdx)$/, "");
  return `/print/${noExt}`;
}

async function main() {
  const exists = await fsp.stat(PAGES_PRINT).then(()=>true).catch(()=>false);
  if (!exists) { console.log("[]"); return; }

  const files = await glob(["**/*.{js,jsx,ts,tsx,mdx}"], { cwd: PAGES_PRINT });
  const routes = [];
  for (const f of files) {
    const base = path.basename(f).replace(/\.(js|jsx|ts|tsx|mdx)$/, "");
    if (SKIP.has(base)) continue;
    // crude dynamic route guard (skip [param].tsx etc.)
    if (/\[.+?\]/.test(f)) continue;
    routes.push(toRoute(path.join(PAGES_PRINT, f)));
  }

  const uniq = [...new Set(routes)].sort();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(uniq, null, 2));
  } else {
    for (const r of uniq) console.log(r);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
