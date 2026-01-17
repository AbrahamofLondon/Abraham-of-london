// content/downloads/THE-FILE-SLUG.tsx - FIXED VERSION
import * as React from "react";
import BrandFrame from "@/components/print/BrandFrame";

export type DownloadTier = "free" | "member" | "inner-circle" | "architect";
export type DownloadFormat = "PDF" | "EXCEL" | "POWERPOINT" | "ZIP" | "BINARY";
export type PaperFormat = "A4" | "Letter" | "A3" | "bundle";

export type DownloadMetadata = {
  title: string;
  slug: string;
  type: "Download";

  date?: string;
  updated?: string;
  author?: string;
  authorTitle?: string;

  subtitle?: string;
  description?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  socialCaption?: string;
  language?: string;

  readTime?: string;
  readingTime?: string;
  featured?: boolean;

  coverImage?: string;
  coverAspect?: "wide" | "book" | "square";
  coverFit?: "cover" | "contain";
  coverPosition?: "top" | "center" | "bottom";

  category?: string;
  tags?: string[];

  tier?: DownloadTier;
  requiresAuth?: boolean;

  format?: DownloadFormat;
  formats?: PaperFormat[];
  fileUrl?: string;
  fileSize?: string;
  version?: string;
};

export const metadata: DownloadMetadata = {
  title: "The Correct Title for This Download",
  slug: "the-file-slug",
  type: "Download",

  date: "2025-10-21",
  author: "Abraham of London",
  authorTitle: "Founder • Strategist",
  subtitle: "A concise description of the download.",
  description: "One-line summary of what this asset does and who it is for. Keep it crisp and benefits-led.",

  category: "Frameworks",
  tags: ["legacy", "governance", "strategy"],

  tier: "free",
  requiresAuth: false,
  format: "PDF",
  formats: ["A4"],
  fileUrl: "/assets/downloads/the-file-slug.pdf",
  fileSize: "0 B",
  version: "1.0.0",

  canonicalUrl: "/downloads/the-file-slug",
  ogTitle: "The Correct Title for This Download",
  ogDescription: "A concise, benefits-led summary for sharing.",
  socialCaption: "Short share caption. Strong, clean, no waffle.",
  language: "en-GB",

  coverAspect: "wide",
  coverFit: "cover",
  coverPosition: "center",
};

const DownloadTemplate: React.FC = () => {
  // Build props object with only defined values
  const brandFrameProps = {
    title: metadata.title,
    subtitle: metadata.subtitle || "", // Required prop with fallback
    pageSize: "A4" as const,
    children: (
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
    )
  };

  // Only add optional props when they have values
  if (metadata.author !== undefined) {
    (brandFrameProps as any).author = metadata.author;
  }
  
  if (metadata.date !== undefined) {
    (brandFrameProps as any).date = metadata.date;
  }

  return <BrandFrame {...brandFrameProps} />;
};

export default DownloadTemplate;