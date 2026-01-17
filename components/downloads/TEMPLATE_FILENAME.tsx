// content/downloads/TEMPLATE_FILENAME.tsx - FIXED VERSION
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

  subtitle?: string;
  description?: string;

  category?: string;
  tags?: string[];

  tier?: DownloadTier;
  requiresAuth?: boolean;

  format?: DownloadFormat;
  formats?: PaperFormat[];

  fileUrl?: string;
  fileSize?: string;
  version?: string;

  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  socialCaption?: string;

  coverImage?: string;
  coverAspect?: "wide" | "book" | "square";
  coverFit?: "cover" | "contain";
  coverPosition?: "top" | "center" | "bottom";

  readTime?: string;
  readingTime?: string;

  featured?: boolean;
  language?: string;
};

export const metadata: DownloadMetadata = {
  title: "The Correct Title for This Download",
  slug: "the-file-slug",
  type: "Download",

  date: "YYYY-MM-DD",
  author: "Abraham of London",

  subtitle: "A concise description of the download.",
  description: "One or two lines explaining the outcome this asset enables.",

  category: "Correct Category",
  tags: [],

  tier: "free",
  requiresAuth: false,

  format: "PDF",
  formats: ["A4"],
  fileUrl: "/assets/downloads/the-file-slug.pdf",
  fileSize: "0 B",
  version: "1.0.0",

  canonicalUrl: "/downloads/the-file-slug",
  ogTitle: "The Correct Title for This Download",
  ogDescription: "Short OG description.",
  socialCaption: "Short share caption.",
  coverAspect: "wide",
  coverFit: "cover",
  coverPosition: "center",

  language: "en-GB",
};

type Props = {
  showHeader?: boolean;
};

const DownloadTemplate: React.FC<Props> = ({ showHeader = true }) => {
  // Create props object with only defined values
  const brandFrameProps = {
    title: metadata.title,
    subtitle: metadata.subtitle || "", // Provide default for required prop
    pageSize: "A4" as const,
    children: (
      <div className="space-y-4">
        {showHeader ? (
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold">{metadata.title}</h1>
            {metadata.subtitle ? (
              <p className="text-sm opacity-80">{metadata.subtitle}</p>
            ) : null}
          </header>
        ) : null}

        <hr className="opacity-20" />

        <section className="space-y-3">
          <p className="text-sm">
            This is where the unique content for this download goes.
          </p>

          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>Replace this scaffold with actual steps, prompts, or framework.</li>
            <li>Keep text printable: short paragraphs, clear headings.</li>
            <li>Use spacing like a grown-up — whitespace is governance.</li>
          </ul>
        </section>
      </div>
    )
  };

  // Conditionally add optional props
  if (metadata.author !== undefined) {
    (brandFrameProps as any).author = metadata.author;
  }
  
  if (metadata.date !== undefined) {
    (brandFrameProps as any).date = metadata.date;
  }

  return <BrandFrame {...brandFrameProps} />;
};

export default DownloadTemplate;