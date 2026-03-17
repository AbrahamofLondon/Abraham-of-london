export type EbookRenderOptions = {
  slug: string;
  out: string;
  tier?: string;
  userId?: string;
  mode?: "source" | "route";
  withCover?: boolean;
  withToc?: boolean;
  withWatermark?: boolean;
};