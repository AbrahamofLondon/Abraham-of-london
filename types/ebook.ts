// types/ebook.ts
export type EbookRenderOptions = {
  slug: string;
  out: string;
  tier?: string;
  userId?: string;
  mode?: "source" | "route";
  withCover?: boolean;
  withToc?: boolean;
  withWatermark?: boolean;
  withFingerprint?: boolean;
  edition?: string;
  paperSize?: "A4" | "Letter" | "Legal";
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
};

export type EbookRenderResult = {
  success: boolean;
  filePath: string;
  pageCount?: number;
  watermarkId?: string;
  fingerprintId?: string;
  error?: string;
  durationMs?: number;
};