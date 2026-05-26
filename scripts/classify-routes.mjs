// scripts/classify-routes.mjs - Temporary route classification script
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(import.meta.url), "..", "..");

function scanDir(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return results; }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
      results.push(...scanDir(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
      if (["_app.tsx", "_document.tsx", "_error.tsx"].includes(entry.name)) continue;
      let content = "";
      try { content = fs.readFileSync(fullPath, "utf8"); } catch { continue; }
      const hasSSR = /export\s+(async\s+)?function\s+getServerSideProps/.test(content);
      const hasSSG = /export\s+(async\s+)?function\s+getStaticProps/.test(content);
      const isApi = fullPath.includes(path.sep + "api" + path.sep) || entry.name === "route.ts" || entry.name === "route.tsx";
      const rel = fullPath.replace(root + path.sep, "").split(path.sep).join("/");
      results.push({ file: rel, ssr: hasSSR, ssg: hasSSG, api: isApi });
    }
  }
  return results;
}

const all = [
  ...scanDir(path.join(root, "pages")),
  ...scanDir(path.join(root, "app")),
];

function classify(r) {
  const f = r.file;
  if (r.api) {
    if (/\/api\/stripe\/|\/api\/billing\/|\/api\/checkout/.test(f)) return "PAYMENT_DYNAMIC";
    if (/\/api\/client\//.test(f)) return "CLIENT_DELIVERY_DYNAMIC";
    if (/\/api\/admin\/intelligence-foundry/.test(f)) return "FOUNDRY_DYNAMIC";
    if (/\/api\/admin\//.test(f)) return "ADMIN_DYNAMIC";
    if (/\/api\/outbound\/|\/api\/linkedin|\/api\/facebook/.test(f)) return "OUTBOUND_DYNAMIC";
    if (/\/api\/downloads|\/api\/download/.test(f)) return "DOWNLOAD_DYNAMIC";
    return "PUBLIC_DYNAMIC";
  }
  if (/pages\/admin\/|app\/admin\//.test(f)) return "ADMIN_DYNAMIC";
  if (/app\/admin\/intelligence-foundry/.test(f)) return "FOUNDRY_DYNAMIC";
  if (/pages\/client\/|pages\/boardroom\/|pages\/case\/shared\/|pages\/inner-circle\/|pages\/directorate\/|pages\/oversight\/|pages\/strategy-room\//.test(f)) return "CLIENT_DELIVERY_DYNAMIC";
  if (/pages\/diagnostics\/executive-reporting/.test(f)) return "CLIENT_DELIVERY_DYNAMIC";
  if (r.ssg && !r.ssr) return "STATIC_NETLIFY";
  if (r.ssr) return "PUBLIC_DYNAMIC";
  const pubPattern = /pages\/(about|accessibility|contact|blog|events|lexicon|books|briefs|canon|content|downloads|editorials|registry|series|shorts|resources|vault|404|500|index|\[slug\])/;
  if (pubPattern.test(f)) return "STATIC_NETLIFY";
  return "PUBLIC_DYNAMIC";
}

const classified = {};
for (const r of all) {
  const cat = classify(r);
  if (!classified[cat]) classified[cat] = [];
  classified[cat].push(r.file);
}

for (const [cat, files] of Object.entries(classified).sort()) {
  console.log(cat + ": " + files.length);
}
console.log("TOTAL:", all.length);

const jsonOut = path.join(root, "reports", "route-classification.json");
fs.writeFileSync(jsonOut, JSON.stringify(classified, null, 2));
console.log("Written:", jsonOut);
