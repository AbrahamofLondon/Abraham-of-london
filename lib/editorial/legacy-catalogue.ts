import { EDITORIAL_CATALOGUE } from "./catalogue";

export type EditorialEntry = {
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  author: string;
  cover?: string;
  pdf: string;
  tier: "public" | "member" | "inner-circle" | "architect";
  readingTime?: string;
};

export const LEGACY_EDITORIAL_CATALOGUE: EditorialEntry[] = EDITORIAL_CATALOGUE.map(
  (entry) => ({
    slug: entry.slug,
    title: entry.title,
    subtitle: entry.subtitle,
    description: entry.description,
    author: entry.author,
    cover: entry.coverImage,
    pdf: entry.pdfPath || "",
    tier:
      entry.tier === "inner_circle"
        ? "inner-circle"
        : (entry.tier as EditorialEntry["tier"]),
    readingTime: entry.readingTime,
  }),
);

// Backward-compatible alias for any old imports
export const EDITORIAL_CATALOGUE_COMPAT = LEGACY_EDITORIAL_CATALOGUE;
export default LEGACY_EDITORIAL_CATALOGUE;