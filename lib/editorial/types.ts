import type { AccessTier } from "@/lib/access/tier-policy";

export type PublicationTier = AccessTier;

export type PublicationFormat = "pdf" | "epub" | "preview" | "print";

export type PrintEdition = {
  provider: "amazon-kdp" | "ingramspark" | "local";
  trimSize?: string;
  paperbackIsbn?: string;
  hardcoverIsbn?: string;
  status?: "draft" | "ready" | "published";
  buyUrl?: string;
};

export type CitationMeta = {
  citationTitle: string;
  citationAuthor: string;
  citationPublisher: string;
  citationYear: string;
  canonicalUrl: string;
  doi?: string;
};

export type PublicationRecord = {
  slug: string;
  contentId: string;
  title: string;
  subtitle?: string;
  description?: string;
  author: string;
  date?: string;
  version?: string;
  status?: string;
  category?: string;
  readingTime?: string;
  tier: PublicationTier;

  coverImage?: string;
  socialImage?: string;

  pdfPath?: string;
  epubPath?: string;
  previewPath?: string;

  previewEnabled: boolean;
  epubEnabled: boolean;
  printEnabled: boolean;
  vaultEnabled: boolean;
  innerCircleEnabled: boolean;

  tags: string[];

  citation: CitationMeta;
  print?: PrintEdition;
};

export type DiscoveredPublication = {
  slug: string;
  title: string;
  description?: string | null;
  cover?: string | null;
  category?: string | null;
  tier?: PublicationTier | null;
  date?: string | null;
};