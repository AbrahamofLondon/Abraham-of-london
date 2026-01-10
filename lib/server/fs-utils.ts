/* lib/server/fs-utils.ts - NODE.JS ENVIRONMENT ONLY */
import fs from "fs";
import path from "path";
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

export function toPublicPathFromPublicDir(absPathInsidePublic: string): string {
  const publicDir = path.join(process.cwd(), "public");
  const rel = path.relative(publicDir, absPathInsidePublic).split(path.sep).join("/");
  return `/${rel}`;
}

