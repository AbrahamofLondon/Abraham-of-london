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

  /**
   * Short bridge note rendered on the editorial page above the canonical body.
   * Explains where this publication sits within the intellectual estate.
   * Kept restrained — this does not market the product ecosystem.
   */
  convergenceNote?: string;

  /**
   * Guard flag — if true, the "Canonical text pending" placeholder is
   * intentional and no console warning should fire in development.
   * A PUBLISHED editorial without this flag AND without a body source
   * will warn at build time.
   */
  canonicalTextPending?: boolean;
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