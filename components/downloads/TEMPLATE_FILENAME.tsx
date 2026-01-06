// content/downloads/TEMPLATE_FILENAME.tsx
import * as React from "react";
import BrandFrame from "@/components/print/BrandFrame";

export type DownloadTier = "free" | "member" | "inner-circle" | "architect";
export type DownloadFormat = "PDF" | "EXCEL" | "POWERPOINT" | "ZIP" | "BINARY";
export type PaperFormat = "A4" | "Letter" | "A3" | "bundle";

export type DownloadMetadata = {
  title: string;
  slug: string;
  type: "Download";

  date?: string; // YYYY-MM-DD
  updated?: string; // YYYY-MM-DD
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
  // future-proof slot for templating
  showHeader?: boolean;
};

const DownloadTemplate: React.FC<Props> = ({ showHeader = true }) => {
  return (
    <BrandFrame
      title={metadata.title}
      subtitle={metadata.subtitle}
      pageSize="A4"
      author={metadata.author}
      date={metadata.date}
    >
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

        {/* Start of Download Content */}
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
        {/* End of Download Content */}
      </div>
    </BrandFrame>
  );
};

export default DownloadTemplate;