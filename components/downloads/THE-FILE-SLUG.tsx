// content/downloads/THE-FILE-SLUG.tsx
import * as React from "react";
import BrandFrame from "@/components/print/BrandFrame";

/**
 * NOTE
 * - This is a TSX "download render" template (not MDX).
 * - Keep metadata keys stable (used by build tools / registry scripts).
 * - Use @/ alias for resilience across refactors.
 */

export type DownloadTier = "free" | "member" | "inner-circle" | "architect";
export type DownloadFormat = "PDF" | "EXCEL" | "POWERPOINT" | "ZIP" | "BINARY";
export type PaperFormat = "A4" | "Letter" | "A3" | "bundle";

export type DownloadMetadata = {
  // Identity
  title: string;
  slug: string;

  // Publishing
  date?: string; // YYYY-MM-DD
  updated?: string; // YYYY-MM-DD
  author?: string;
  authorTitle?: string;

  // Description / SEO
  subtitle?: string;
  description?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  socialCaption?: string;
  language?: string;

  // UX
  readTime?: string;
  readingTime?: string;
  featured?: boolean;

  // Presentation
  coverImage?: string;
  coverAspect?: "wide" | "book" | "square";
  coverFit?: "cover" | "contain";
  coverPosition?: "top" | "center" | "bottom";

  // Classification
  type: "Download";
  category?: string;
  tags?: string[];

  // Access
  tier?: DownloadTier;
  requiresAuth?: boolean;

  // File
  format?: DownloadFormat;
  formats?: PaperFormat[];
  fileUrl?: string; // public path e.g. /assets/downloads/foo.pdf
  fileSize?: string; // human label e.g. "2.1 MB"
  version?: string;
};

export const metadata: DownloadMetadata = {
  // REQUIRED: make these correct per file
  title: "The Correct Title for This Download",
  slug: "the-file-slug",
  type: "Download",

  // RECOMMENDED
  date: "2025-10-21",
  author: "Abraham of London",
  authorTitle: "Founder • Strategist",
  subtitle: "A concise description of the download.",
  description:
    "One-line summary of what this asset does and who it is for. Keep it crisp and benefits-led.",

  category: "Frameworks",
  tags: ["legacy", "governance", "strategy"],

  // Access + file identity (helps your PDF registry)
  tier: "free",
  requiresAuth: false,
  format: "PDF",
  formats: ["A4"],
  fileUrl: "/assets/downloads/the-file-slug.pdf",
  fileSize: "0 B",
  version: "1.0.0",

  // Optional social
  canonicalUrl: "/downloads/the-file-slug",
  ogTitle: "The Correct Title for This Download",
  ogDescription: "A concise, benefits-led summary for sharing.",
  socialCaption: "Short share caption. Strong, clean, no waffle.",
  language: "en-GB",

  // Optional presentation
  coverAspect: "wide",
  coverFit: "cover",
  coverPosition: "center",
};

const DownloadTemplate: React.FC = () => {
  return (
    <BrandFrame
      title={metadata.title}
      subtitle={metadata.subtitle}
      pageSize="A4"
      author={metadata.author}
      date={metadata.date}
    >
      {/* Start of Download Content */}
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{metadata.title}</h1>

        {metadata.subtitle ? (
          <p className="text-sm opacity-80">{metadata.subtitle}</p>
        ) : null}

        <hr className="opacity-20" />

        <p className="text-sm">
          This is the content of the download. Replace with your real material.
        </p>
      </div>
      {/* End of Download Content */}
    </BrandFrame>
  );
};

export default DownloadTemplate;