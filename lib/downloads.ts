// lib/downloads.ts

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

// --- Type Definitions ---

/** Represents a single structured entry from the _downloads-registry.md manifest. */
export interface ManifestEntry {
  id: string; // Unique slug (e.g., 'leadership-playbook')
  title: string; // Pretty label (used if dynamic title is not desired)
  description?: string;
  file_path: string; // Direct file path under /public (e.g., /downloads/Leadership_Playbook.pdf)
  icon?: string;
  category?: string;
  featured: boolean;
  
  // Dynamic fields added after merging with fs stats
  bytes?: number;
  size?: string; // Human readable size
  modified?: string; // ISO mtime
}

export type DownloadItem = ManifestEntry; // Alias for clarity

// --- Constants and Paths ---

// Use process.cwd() for root, necessary for finding the content directory
const ROOT = process.cwd();
const DOWNLOADS_PUBLIC_DIR = path.join(ROOT, "public", "downloads");
const DOWNLOADS_MANIFEST_PATH = path.join(ROOT, "content", "_downloads-registry.md");

// --- Private Helpers ---

/** Converts bytes to a human-readable size string. */
function human(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let i = -1;
  let size = bytes;
  
  do {
    size /= 1024;
    i++;
  } while (size >= 1024 && i < units.length - 1);
  
  // Use toFixed for max 1 decimal place, ensuring clean output
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[i]}`;
}

// NOTE: toTitle function is no longer needed for dynamically renaming files, 
// as the title comes from the structured manifest data.

/**
 * Maps a manifest file path to the absolute file system path.
 * @param relativePath Path starting with /downloads/...
 * @returns Absolute path or null if invalid.
 */
function toAbsolutePath(relativePath: string): string | null {
    if (!relativePath || !relativePath.startsWith("/downloads/")) return null;
    // Replace the public prefix with the absolute public directory path
    return path.join(ROOT, "public", relativePath.substring(1));
}


// --- Data Fetching (Server-Side) ---

/**
 * Reads and parses the structured download manifest file.
 * @returns Array of ManifestEntry or an empty array on error/missing file.
 */
async function getDownloadManifest(): Promise<ManifestEntry[]> {
    try {
        const fileContent = await fs.readFile(DOWNLOADS_MANIFEST_PATH, "utf-8");
        const { data } = matter(fileContent);
        
        // Ensure data is present and contains a 'downloads' array
        if (data && Array.isArray(data.downloads)) {
            // Basic type casting and filtering for robustness
            return data.downloads
                .map((d: any) => ({
                    ...d,
                    id: String(d.id),
                    title: String(d.title),
                    featured: Boolean(d.featured),
                }))
                .filter((d: any) => d.file_path && d.id);
        }
    } catch (error) {
        console.error("Failed to read or parse downloads manifest:", error);
    }
    return [];
}


/**
 * Fetches the static manifest data and merges it with dynamic file system stats (size, modified time).
 * This is the primary function to call in Next.js data fetching methods (GetStaticProps).
 * @returns A promise resolving to an array of complete DownloadItem objects.
 */
export async function getDownloadsMetadata(): Promise<DownloadItem[]> {
    const manifest = await getDownloadManifest();
    const items: DownloadItem[] = [];

    for (const entry of manifest) {
        const fullPath = toAbsolutePath(entry.file_path);
        if (!fullPath) continue; // Skip if file path is malformed

        try {
            const stat = await fs.stat(fullPath);

            items.push({
                ...entry,
                bytes: stat.size,
                size: human(stat.size),
                modified: stat.mtime.toISOString(),
            });

        } catch (error) {
            // Log missing file but continue processing the manifest
            console.warn(`Manifest entry for ID '${entry.id}' points to a missing file: ${entry.file_path}`);
            // Optionally, push the item without dynamic stats if it's crucial for the UI
            // items.push(entry); 
        }
    }

    // Sort by featured status (featured first), then by modification time (newest first)
    items.sort((a, b) => {
        if (a.featured !== b.featured) {
            return a.featured ? -1 : 1; // Featured before unfeatured
        }
        // Fallback to sorting by modified time (requires modified field to be present)
        const dateA = a.modified ? Date.parse(a.modified) : 0;
        const dateB = b.modified ? Date.parse(b.modified) : 0;
        return dateB - dateA;
    });

    return items;
}

// ------------------------------------
// --- DISPLAY UTILITIES (Refined) ---
// ------------------------------------

/** Represents a link button/pill displayed to the user. */
export type DownloadPill =
    | { kind: "notes"; label: string; href: string }
    | { kind: "pdf"; label: string; href: string; download: true };

// Replace hardcoded DOWNLOADS object with a simple utility function that takes the manifest.
/**
 * Utility to produce structured pill items for Notes + PDF based on manifest entries.
 * @param ids Array of manifest entry IDs to generate pills for.
 * @param manifest The full list of DownloadItem entries.
 */
export function buildDownloadPills(ids: string[], manifest: DownloadItem[]): DownloadPill[] {
    const manifestMap = new Map(manifest.map(d => [d.id, d]));

    return ids.flatMap((id) => {
        const item = manifestMap.get(id);
        if (!item) return [];

        // Assume there is a corresponding notes/landing page for every ID
        const items: DownloadPill[] = [
            { 
                kind: "notes" as const, 
                label: "Read Notes", 
                // Assuming notes page slug matches the ID
                href: `/downloads/${item.id}` 
            },
        ];
        
        // Add PDF link if the file path is present and valid
        if (item.file_path) {
            items.push({ 
                kind: "pdf" as const, 
                label: `Download PDF (${item.size || 'File'})`, 
                href: item.file_path, 
                download: true 
            });
        }

        return items;
    });
}