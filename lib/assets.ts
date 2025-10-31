// lib/assets.ts
import fs from "node:fs";
import path from "node:path";

const PUBLIC_DIR = path.join(process.cwd(), "public");

export function assetPath(rel: string): string {
  if (!rel.startsWith("/")) rel = "/" + rel;
  const onDisk = path.join(PUBLIC_DIR, rel);
  if (!fs.existsSync(onDisk)) {
    throw new Error(`[ASSET MISSING] ${rel} -> ${onDisk}`);
  }
  return rel; // return web path
}
