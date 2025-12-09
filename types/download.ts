// types/download.ts

export interface DownloadMeta {
  slug: string;
  title: string;

  // Text / description
  excerpt?: string;
  description?: string;

  // Classification
  category?: string;
  tags?: string[];

  // File information
  filePath?: string;          // e.g. "/assets/downloads/..."
  fileSizeLabel?: string;     // e.g. "2.3 MB PDF"
  fileType?: string;          // e.g. "pdf", "xlsx", "pptx"

  // Presentation
  coverImage?: string | { src?: string } | null;
  heroImage?: string;
  readTime?: string;          // for downloads that double as long-form reads

  // Editorial
  date?: string;
  author?: string;
  draft?: boolean;
  featured?: boolean;

  // Access control
  accessLevel?: string;       // e.g. "public" | "inner-circle"
  lockMessage?: string | null;
}

// Add this for backward compatibility
export type DownloadItem = DownloadMeta;