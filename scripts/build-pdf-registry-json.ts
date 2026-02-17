// scripts/build-pdf-registry-json.ts
import fs from "fs";
import path from "path";

// IMPORTANT: relative import so tsx resolves TS correctly
import { ALL_SOURCE_PDFS } from "./pdf/pdf-registry.source";

function asArray(x: any): any[] {
  return Array.isArray(x) ? x : Array.isArray(x?.items) ? x.items : [];
}

async function main() {
  const outDir = path.join(process.cwd(), "public", "pdfs");
  const outFile = path.join(outDir, "registry.json");

  const arr = asArray(ALL_SOURCE_PDFS);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify({ items: arr }, null, 2), "utf8");

  console.log(`[build-pdf-registry-json] Wrote ${arr.length} items → ${outFile}`);
}

main().catch((e) => {
  console.error("[build-pdf-registry-json] Fatal:", e);
  process.exit(1);
});