import fs from "fs";
import path from "path";
import matter from "gray-matter";

export const CONTENT_ROOT = path.join(process.cwd(), "content");
export const MD_EXTS = [".md", ".mdx"];

export function ensureDir(dir: string): string | null {
  try {
    const abs = path.join(CONTENT_ROOT, dir);
    if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) return abs;
    return null;
  } catch { return null; }
}

export function listMdFiles(absDir: string): string[] {
  return fs.readdirSync(absDir)
    .filter(f => MD_EXTS.some(ext => f.toLowerCase().endsWith(ext)))
    .map(f => path.join(absDir, f));
}

export function fileToSlug(filePath: string): string {
  const base = path.basename(filePath);
  const slug = base.replace(/\.(mdx?|MDX?)$/, "");
  return slug.trim();
}

export function readFrontmatter(absFile: string) {
  const raw = fs.readFileSync(absFile, "utf8");
  const { data, content } = matter(raw);
  return { data: data as Record<string, any>, content };
}

export function sortByDateDesc<T extends { date?: string }>(items: T[]): T[] {
  const toKey = (d?: string) => d ? new Date(d).valueOf() : 0;
  return [...items].sort((a, b) => toKey(b.date) - toKey(a.date));
}
