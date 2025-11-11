// types/download.ts
import type { BaseContentMeta } from "./index";

export interface DownloadItem extends BaseContentMeta {
  // Required download fields
  file: string;

  // File metadata
  fileSize?: string;
  fileType?: string;
  mimeType?: string;

  // Download-specific fields
  downloadCount?: number;
  version?: string;
  license?: string;
  requirements?: string[];

  // Technical details
  checksum?: string;
  fileExtension?: string;

  // Display and organization
  featured?: boolean;
  priority?: number;
  category?: string;

  // Legacy/compatibility fields
  href?: string; // alias for file
  size?: string; // alias for fileSize
  pdfPath?: string | null; // legacy field
}

export interface DownloadMeta extends BaseContentMeta {
  // File information
  file: string;
  fileSize?: string;
  fileType?: string;

  // Download tracking
  downloadCount?: number;
  lastDownloaded?: string;

  // Versioning
  version?: string;
  changelog?: string;

  // Security and validation
  checksum?: string;
  verified?: boolean;

  // Legacy support
  pdfPath?: string | null;
}

// Type guards
export const isDownloadItem = (item: unknown): item is DownloadItem => {
  return (
    typeof item === "object" &&
    item !== null &&
    "slug" in item &&
    "title" in item &&
    "file" in item &&
    typeof (item as DownloadItem).slug === "string" &&
    typeof (item as DownloadItem).title === "string" &&
    typeof (item as DownloadItem).file === "string"
  );
};

export const isDownloadMeta = (meta: unknown): meta is DownloadMeta => {
  return isDownloadItem(meta);
};

// Utility functions
export const createDownloadItem = (
  overrides: Partial<DownloadItem> = {},
): DownloadItem => ({
  slug: "",
  title: "",
  file: "",
  ...overrides,
});

export const getFileExtension = (download: DownloadItem): string => {
  if (download.fileExtension) {
    return download.fileExtension;
  }

  const match = download.file.match(/\.([0-9a-z]+)$/i);
  return match ? match[1].toLowerCase() : "unknown";
};

export const getFileTypeCategory = (download: DownloadItem): string => {
  const ext = getFileExtension(download);

  const categories: Record<string, string> = {
    pdf: "document",
    doc: "document",
    docx: "document",
    txt: "document",
    zip: "archive",
    rar: "archive",
    "7z": "archive",
    xls: "spreadsheet",
    xlsx: "spreadsheet",
    csv: "spreadsheet",
    ppt: "presentation",
    pptx: "presentation",
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    svg: "image",
    mp4: "video",
    mov: "video",
    avi: "video",
    mp3: "audio",
    wav: "audio",
  };

  return categories[ext] || "file";
};

// Collection utilities
export interface DownloadCollection {
  downloads: DownloadItem[];
  total: number;
  categories: string[];
  fileTypes: string[];
}

export const createDownloadCollection = (
  downloads: DownloadItem[],
): DownloadCollection => {
  const categories = Array.from(
    new Set(downloads.map((d) => d.category).filter(Boolean)),
  ) as string[];
  const fileTypes = Array.from(
    new Set(downloads.map((d) => getFileTypeCategory(d))),
  );

  return {
    downloads: downloads.sort((a, b) =>
      (a.title || "").localeCompare(b.title || ""),
    ),
    total: downloads.length,
    categories,
    fileTypes,
  };
};
