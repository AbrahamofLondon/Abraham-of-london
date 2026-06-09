/**
 * scripts/generate-library-index-lite.ts
 *
 * Generates public/system/library-index-lite.json — the trimmed library index
 * used by the /library page for client-side lazy loading.
 *
 * Must run AFTER contentlayer2 build (needs generated documents).
 * Called from: build:netlify:safe, Vercel buildCommand.
 *
 * Run standalone: pnpm exec tsx scripts/generate-library-index-lite.ts
 */

import * as fs from "fs";
import * as path from "path";
import { buildLibraryIndex } from "../lib/library/library-index";
import { toLibraryLiteItem } from "../lib/library/library-lite";

const index = buildLibraryIndex();
const liteItems = index.items.map(toLibraryLiteItem);

const outPath = path.join(process.cwd(), "public/system/library-index-lite.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(liteItems));

const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
console.log(
  `[generate-library-index-lite] Wrote ${liteItems.length} items → public/system/library-index-lite.json (${sizeKb} kB uncompressed)`,
);
