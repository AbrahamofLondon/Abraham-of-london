import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { useMDXComponent } from "next-contentlayer/hooks";
import { ArrowLeft, Share2 } from "lucide-react";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";

type ContentlayerDoc = {
  title?: string | null;
  excerpt?: string | null;
  description?: string | null;
  coverImage?: string | null;
  category?: string | null;
  date?: string | null;
  readTime?: string | null;
  tags?: string[] | null;
  draft?: boolean | null;
  slug?: string | null;
  body?: { code?: string | null };
  _raw?: { flattenedPath?: string };
};

type Props = {
  doc: ContentlayerDoc;
  canonicalPath: string; // "/content/slug" | "/downloads/slug" | absolute URL
  backHref?: string; // "/content"
  label?: string; // "Reading Room"
  components?: Record<string, React.ComponentType<any>>;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

function safeDate(date?: string | null) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function toAbsoluteUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return null;
  const s = String(pathOrUrl);
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${SITE_URL}${s}`;
  // last resort — treat as relative asset path
  return `${SITE_URL}/${s}`;
}

export default function ContentlayerDocPage({
  doc,
  canonicalPath,
  backHref = "/content",
  label = "Reading Room",
  components = mdxComponents,
}: Props) {
  const title = (doc.title?.trim() || "Untitled") + "";
  const description =
    doc.excerpt?.trim() ||
    doc.description?.trim() ||
    "Strategic reading from Abraham of London.";

  const canonicalUrl = canonicalPath.startsWith("http")
    ? canonicalPath
    : `${SITE_URL}${canonicalPath}`;

  const ogImage = toAbsoluteUrl(doc.coverImage);

  const code = doc?.body?.code ?? "";
  const MDXContent = useMDXComponent(code);

  const onShare = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const url = canonicalUrl;

    if (navigator.share) {
      navigator.share({ title, text: description, url }).catch(() => {});
      return;
    }

    navigator.clipboard.writeText(url).catch(() => {});
  }, [canonicalUrl, title, description]);

  const displayDate = safeDate(doc.date);

  return (
    <Layout title={title} description={description} image={doc.coverImage ?? undefined}>
      <Head>
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {ogImage ? <meta property="og:image" content={ogImage} /> : null}
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* Theme-aware surface (fixes washed-out dark mode) */}
      <main className="min-h-[70vh] bg-transparent">
        {/* Top bar */}
        <nav className="sticky top-0 z-10 border-b border-black/10 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-black/35">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 lg:px-8">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-950 dark:text-cream/80 dark:hover:text-cream"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{label}</span>
            </Link>

            <button
              type="button"
              onClick={onShare}
              className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-white/10 dark:bg-black/20 dark:text-cream/90 dark:hover:bg-white/5"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </nav>

        <article className="mx-auto max-w-4xl px-6 py-14 lg:px-8 lg:py-20">
          <header className="mb-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-softGold/70">
              {doc.category || label}
            </p>

            <h1 className="font-serif text-4xl font-semibold tracking-tight text-neutral-950 dark:text-cream sm:text-5xl">
              {title}
            </h1>

            {doc.excerpt ? (
              <p className="mt-5 text-lg leading-relaxed text-neutral-700 dark:text-cream/80">
                {doc.excerpt}
              </p>
            ) : null}

            {(displayDate || doc.readTime) && (
              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-softGold/70">
                {displayDate ? <span>{displayDate}</span> : null}
                {doc.readTime ? <span>• {doc.readTime}</span> : null}
              </div>
            )}

            {doc.tags?.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {doc.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-[11px] font-medium text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-cream/80"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </header>

          {/* ✅ Always pass components (prevents “Expected component X to be defined”) */}
          <div className="prose max-w-none dark:prose-invert prose-headings:font-serif">
            {code?.trim() ? (
              <MDXContent components={components} />
            ) : (
              <p>Content is being prepared.</p>
            )}
          </div>
        </article>
      </main>
    </Layout>
  );
}