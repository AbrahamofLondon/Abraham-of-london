// lib/server/md-utils.ts
import fs from "node:fs";
import path from "node:path";
import { safeListFiles } from "@/lib/fs-utils";

export function readTextFile(absPath: string): string {
  return fs.readFileSync(absPath, "utf8");
}

export function listFilesByExt(absDir: string, ext: string): string[] {
  const files = safeListFiles(absDir);
  return files.filter((f) => f.toLowerCase().endsWith(ext.toLowerCase()));
}

export function listMdxFiles(absDir: string): string[] {
  return listFilesByExt(absDir, ".mdx");
}

export function listJsonFiles(absDir: string): string[] {
  return listFilesByExt(absDir, ".json");
}

export function toPublicPathFromPublicDir(absPathInsidePublic: string): string {
  // Example: C:\repo\public\assets\images\x.jpg -> /assets/images/x.jpg
  const publicDir = path.join(process.cwd(), "public");
  const rel = path.relative(publicDir, absPathInsidePublic).split(path.sep).join("/");
  return `/${rel}`;
}