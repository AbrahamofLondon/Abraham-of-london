scripts/strip-trailing-garbage.cjs
const fs = require("fs");
const p = "pages/index.tsx";
const raw = fs.readFileSync(p, "utf8");
const m = raw.match(/^[\s\S]*^\s*}\s*$/m);
if (!m) process.exit(0);
const fixed = m[0].replace(/\s+$/, "") + "\n";
if (fixed !== raw) {
  fs.writeFileSync(p, fixed);
  console.log("[guard] Stripped trailing garbage in pages/index.tsx");
}
