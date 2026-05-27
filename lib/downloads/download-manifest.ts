import { GENERATED_PDF_CONFIGS } from "@/lib/pdf/pdf-registry.generated";

export type DownloadAccessLevel =
  | "public"
  | "inner_circle"
  | "paid"
  | "restricted";

export type DownloadManifestEntry = {
  slug: string;
  title: string;
  accessLevel: DownloadAccessLevel;
  entitlementSlug?: string;
  publicUrl?: string;
  storageUrl?: string;
  canonicalPath?: string;
  fileType: string;
  isPublic: boolean;
  isDownloadable: boolean;
};

function normalizeSlug(input: unknown): string {
  return String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/^downloads\//i, "")
    .replace(/\.pdf$/i, "")
    .replace(/\/{2,}/g, "/")
    .split("/")
    .filter(Boolean)
    .pop()
    ?.toLowerCase() || "";
}

function fileTypeFromPath(value: string): string {
  const match = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(value);
  return match?.[1]?.toLowerCase() || "pdf";
}

const CURATED_DOWNLOADS: DownloadManifestEntry[] = [
  {
    slug: "ultimate-purpose-of-man-editorial",
    title: "The Ultimate Purpose of Man - Strategic Editorial",
    accessLevel: "public",
    publicUrl: "/assets/downloads/ultimate-purpose-of-man-editorial.pdf",
    canonicalPath: "/assets/downloads/ultimate-purpose-of-man-editorial.pdf",
    fileType: "pdf",
    isPublic: true,
    isDownloadable: true,
  },
  {
    slug: "legacy-architecture-canvas",
    title: "Legacy Architecture Canvas",
    accessLevel: "inner_circle",
    entitlementSlug: "legacy-architecture-canvas",
    storageUrl: "/assets/downloads/legacy-architecture-canvas.pdf",
    canonicalPath: "/assets/downloads/legacy-architecture-canvas.pdf",
    fileType: "pdf",
    isPublic: false,
    isDownloadable: true,
  },
  {
    slug: "download-legacy-architecture-canvas",
    title: "Legacy Architecture Canvas",
    accessLevel: "inner_circle",
    entitlementSlug: "legacy-architecture-canvas",
    storageUrl: "/assets/downloads/legacy-architecture-canvas.pdf",
    canonicalPath: "/assets/downloads/legacy-architecture-canvas.pdf",
    fileType: "pdf",
    isPublic: false,
    isDownloadable: true,
  },
  {
    slug: "global-market-intelligence-report-q1-2026",
    title: "Global Market Intelligence Report Q1 2026",
    accessLevel: "paid",
    entitlementSlug: "global-market-intelligence-report-q1-2026",
    storageUrl: "/api/premium/content/download/global-market-intelligence-report-q1-2026",
    canonicalPath: "/assets/downloads/global-market-intelligence-report-q1-2026.pdf",
    fileType: "pdf",
    isPublic: false,
    isDownloadable: true,
  },
  {
    slug: "global-market-intelligence-board-deck-q1-2026",
    title: "Global Market Intelligence Q1 2026 - Board Briefing Deck",
    accessLevel: "paid",
    entitlementSlug: "global-market-intelligence-board-deck-q1-2026",
    storageUrl: "/api/premium/content/download/global-market-intelligence-board-deck-q1-2026",
    canonicalPath: "/assets/downloads/global-market-intelligence-board-deck-q1-2026.pdf",
    fileType: "pptx",
    isPublic: false,
    isDownloadable: true,
  },
];

const GENERATED_PUBLIC_DOWNLOADS: DownloadManifestEntry[] =
  GENERATED_PDF_CONFIGS.map((entry) => {
    const canonicalPath = String(entry.outputPath || "");
    const slug = normalizeSlug(entry.id || canonicalPath);

    return {
      slug,
      title: String(entry.title || slug),
      accessLevel: "public" as const,
      publicUrl: canonicalPath,
      canonicalPath,
      fileType: fileTypeFromPath(canonicalPath),
      isPublic: true,
      isDownloadable: Boolean(slug && canonicalPath),
    };
  }).filter((entry) => entry.slug && entry.canonicalPath);

export const DOWNLOAD_MANIFEST: readonly DownloadManifestEntry[] = [
  ...CURATED_DOWNLOADS,
  ...GENERATED_PUBLIC_DOWNLOADS,
];

export function getDownloadManifestEntry(
  slugInput: unknown,
): DownloadManifestEntry | null {
  const slug = normalizeSlug(slugInput);
  if (!slug) return null;
  return DOWNLOAD_MANIFEST.find((entry) => entry.slug === slug) || null;
}

export function getDownloadRedirectUrl(
  entry: DownloadManifestEntry,
): string | null {
  return entry.isPublic
    ? entry.publicUrl || entry.canonicalPath || null
    : entry.storageUrl || entry.canonicalPath || null;
}

export function normalizeDownloadManifestSlug(input: unknown): string {
  return normalizeSlug(input);
}
