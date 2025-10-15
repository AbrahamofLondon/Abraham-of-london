// lib/downloads.ts
// Server-only helper: scans /public/downloads for files (e.g. PDFs)

import fs from "node:fs";
import path from "node:path";

export type DownloadItem = {
  file: string;          // file name (e.g. "Mentorship_Starter_Kit.pdf")
  href: string;          // public URL (e.g. "/downloads/Mentorship_Starter_Kit.pdf")
  title: string;         // pretty title (e.g. "Mentorship Starter Kit")
  bytes: number;         // raw size
  size: string;          // human size (e.g. "45 KB")
  modified: string;      // ISO mtime
  ext: string;           // ".pdf"
};

const ROOT = process.cwd();
const DIR = path.join(ROOT, "public", "downloads");

function human(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

function toTitle(file: string) {
  const base = file.replace(/\.[^.]+$/, "");
  return base.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getDownloads(): DownloadItem[] {
  if (!fs.existsSync(DIR)) return [];
  const entries = fs.readdirSync(DIR, { withFileTypes: true });

  const items: DownloadItem[] = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    const file = e.name;
    const ext = path.extname(file).toLowerCase();
    // include PDFs; add more extensions if you like
    if (![".pdf"].includes(ext)) continue;

    const full = path.join(DIR, file);
    const stat = fs.statSync(full);
    items.push({
      file,
      href: `/downloads/${file}`,
      title: toTitle(file),
      bytes: stat.size,
      size: human(stat.size),
      modified: stat.mtime.toISOString(),
      ext,
    });
  }

  // newest first by mtime
  items.sort((a, b) => Date.parse(b.modified) - Date.parse(a.modified));
  return items;
}
