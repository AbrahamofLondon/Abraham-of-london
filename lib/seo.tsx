// lib/seo.ts
export interface SeoInput {
  /** Page title without site suffix */
  title?: string;
  /** Plain-text description (<= 160 chars ideal) */
  description?: string;
  /** Path beginning with '/' OR absolute URL */
  path?: string;
  /** Absolute URL to image (OG/Twitter) */
  imageUrl?: string;
  /** Optional noindex */
  noindex?: boolean;
  /** Optional canonical override (absolute URL) */
  canonicalUrl?: string;
}

export interface BuiltSeo {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  openGraph: {
    title: string;
    description: string;
    url: string;
    images?: { url: string }[];
    type: "website" | "article";
  };
  twitter: {
    card: "summary" | "summary_large_image";
    title: string;
    description: string;
    image?: string;
  };
}

const SITE_NAME = "Abraham of London";
const DEFAULT_DESC = "Insights, strategy, and leadership from Abraham of London.";

function getBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "https://abrahamoflondon.org").trim();
  return raw.replace(/\/+$/, "");
}

export function toAbsoluteUrl(input?: string): string | undefined {
  if (!input) return undefined;
  if (/^https?:\/\//i.test(input)) return input;
  return `${getBaseUrl()}/${input.replace(/^\/+/, "")}`;
}

export function canonicalFrom(path?: string, override?: string): string {
  if (override && /^https?:\/\//i.test(override)) return override;
  if (!path) return getBaseUrl();
  return toAbsoluteUrl(path)!;
}

export function buildSeo(input: SeoInput, asArticle = false): BuiltSeo {
  const baseUrl = getBaseUrl();
  const titleCore = (input.title || SITE_NAME).trim();
  const title = input.title ? `${titleCore} | ${SITE_NAME}` : SITE_NAME;
  const description = (input.description || DEFAULT_DESC).trim();
  const canonical = canonicalFrom(input.path, input.canonicalUrl);
  const robots = input.noindex ? "noindex,follow" : "index,follow";
  const imgAbs = toAbsoluteUrl(input.imageUrl);

  return {
    title,
    description,
    canonical,
    robots,
    openGraph: {
      title: titleCore,
      description,
      url: canonical || baseUrl,
      images: imgAbs ? [{ url: imgAbs }] : undefined,
      type: asArticle ? "article" : "website",
    },
    twitter: {
      card: imgAbs ? "summary_large_image" : "summary",
      title: titleCore,
      description,
      image: imgAbs,
    },
  };
}