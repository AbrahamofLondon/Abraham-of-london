// lib/downloads.ts

import fs from "node:fs";
import path from "node:path";

// --- DYNAMIC DOWNLOAD LISTING ---

/** Represents a dynamically discovered file in the /public/downloads directory. */
export type DownloadItem = {
  file: string;           // file name (e.g. "Mentorship_Starter_Kit.pdf")
  href: string;           // public URL (e.g. "/downloads/Mentorship_Starter_Kit.pdf")
  title: string;          // pretty title (e.g. "Mentorship Starter Kit")
  bytes: number;          // raw size
  size: string;           // human size (e.g. "45 KB")
  modified: string;       // ISO mtime
  ext: string;            // ".pdf"
};

const ROOT = process.cwd();
const DIR = path.join(ROOT, "public", "downloads");

/** Converts bytes to a human-readable size string. */
function human(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

/** Converts a file name (e.g., "File_Name.pdf") to a title (e.g., "File Name"). */
function toTitle(file: string) {
  const base = file.replace(/\.[^.]+$/, "");
  return base.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Scans the /public/downloads directory for files (PDFs only, currently). */
// FIX: Restored export for the getDownloads function
export function getDownloads(): DownloadItem[] {
  if (!fs.existsSync(DIR)) return [];
  const entries = fs.readdirSync(DIR, { withFileTypes: true });

  const items: DownloadItem[] = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    const file = e.name;
    const ext = path.extname(file).toLowerCase();
    // Only include PDFs
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

  // Sort by newest first by modification time
  items.sort((a, b) => Date.parse(b.modified) - Date.parse(a.modified));
  return items;
}

// --- STATIC DOWNLOAD METADATA ---

export type DownloadEntry = {
  /** Pretty label for this resource (used on detail pages, etc.) */
  label: string;
  /** Route to the notes/landing page (your /pages/downloads/[slug].tsx) */
  page: string;
  /** Direct PDF path under /public/downloads (optional) */
  pdf?: string;
};

/**
 * Hard-coded list of featured downloads, used for static linking
 * in navigation and content components.
 */
export const DOWNLOADS = {
  brotherhoodCovenant: {
    label: "Brotherhood Covenant (Printable)",
    page: "/downloads/brotherhood-covenant",
    // ⬇️ Update the filename if yours differs
    pdf: "/downloads/Brotherhood_Covenant_Printable.pdf",
  },
  leadersCueCard: {
    label: "Leader’s Cue Card (A6, Two-Up)",
    page: "/downloads/leaders-cue-card",
    // ⬇️ Update the filename if yours differs
    pdf: "/downloads/Leaders_Cue_Card_A6_Two-Up.pdf",
  },
} as const;

export type DownloadKey = keyof typeof DOWNLOADS;

// NEW TYPE: Define the union of possible "pill" item types
type PillItem = 
  | { kind: "notes", label: string, href: string }
  | { kind: "pdf", label: string, href: string, download: true };

/** Utility to produce pill items for Notes + PDF */
export function buildNotesAndPdfPills(keys: DownloadKey[]) {
  return keys.flatMap((key) => {
    const d = DOWNLOADS[key];
    if (!d) return [];
    
    // FIX: Explicitly type the items array as PillItem[]
    const items: PillItem[] = [ 
      { kind: "notes" as const, label: "Notes", href: d.page },
    ];
    if (d.pdf) items.push({ kind: "pdf" as const, label: "PDF", href: d.pdf, download: true });
    return items;
  });
}