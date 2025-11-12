// lib/downloads.ts
// Facade over the server downloads loader to avoid direct deep imports.

export {
  getDownloadSlugs,
  getDownloadBySlug,
  getDownloadsBySlugs,
  getAllDownloads,
  getAllContent,
  extractResourceSlugs,
} from "@/lib/server/downloads-data";

export type { DownloadMeta, DownloadFieldKey } from "@/lib/server/downloads-data";