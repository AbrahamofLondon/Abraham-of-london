// components/ContentlayerDocPage.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { useMDXComponent } from "next-contentlayer/hooks";
import { ArrowLeft, Share2, Lock } from "lucide-react";

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
  draft?: boolean | string | null;
  slug?: string | null;
  body?: { code?: string | null };

  // Contentlayer raw metadata (useful for debugging/robustness)
  _raw?: { flattenedPath?: string };

  // Access gating (Canon / Inner Circle)
  accessLevel?: string | null;
  lockMessage?: string | null;
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

/** ------------------------------------------------------------------------ */
/** Helpers                                                                  */
/** ------------------------------------------------------------------------ */

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
  const s = String(pathOrUrl).trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${SITE_URL}${s}`;
  return `${SITE_URL}/${s}`;
}

function safeText(v: unknown, fallback: string) {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : fallback;
}

function safeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter(Boolean);
}

function isInnerCircle(doc: ContentlayerDoc) {
  const level = (doc.accessLevel ?? "").toString().toLowerCase();
  return level === "inner-circle" || level === "innercircle" || level === "members";
}

function buildCanonicalUrl(canonicalPath: string) {
  const s = String(canonicalPath || "").trim();
  if (!s) return SITE_URL;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${SITE_URL}${s}`;
  return `${SITE_URL}/${s}`;
}

/** ------------------------------------------------------------------------ */
/** Component                                                                */
/** ------------------------------------------------------------------------ */

export default function ContentlayerDocPage({
  doc,
  canonicalPath,
  backHref = "/content",
  label = "Reading Room",
  components = mdxComponents,
}: Props) {
  const title = safeText(doc?.title, "Untitled");
  const description = safeText(
    doc?.excerpt || doc?.description,
    "Strategic reading from Abraham of London."
  );

  const canonicalUrl = buildCanonicalUrl(canonicalPath);
  const ogImage = toAbsoluteUrl(doc?.coverImage ?? null);

  const code = String(doc?.body?.code ?? "");
  const hasCode = Boolean(code.trim());

  // If access is gated, show lock panel (and do not pretend it’s “compiling”)
  const locked = isInnerCircle(doc) && !hasCode;

  // Defensive: useMDXComponent expects a string; empty string is ok.
  const MDXContent = useMDXComponent(code);

  const displayDate = safeDate(doc?.date ?? null);
  const tags = safeTags(doc?.tags);

  const onShare = React.useCallback(() => {
    if (typeof window === "undefined") return;

    const url = canonicalUrl;

    // Some browsers throw if share is called outside a user gesture.
    if (navigator.share) {
      navigator.share({ title, text: description, url }).catch(() => {});
      return;
    }

    // Clipboard may be blocked; fail silently.
    navigator.clipboard?.writeText?.(url).catch(() => {});
  }, [canonicalUrl, title, description]);

  const ogTitle = title;
  const ogDescription = description;

  return (
    <Layout
      title={title}
      description={description}
      image={doc?.coverImage ?? undefined}
    >
      <Head>
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
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
              {doc?.category || label}
            </p>

            <h1 className="font-serif text-4xl font-semibold tracking-tight text-neutral-950 dark:text-cream sm:text-5xl">
              {title}
            </h1>

            {doc?.excerpt ? (
              <p className="mt-5 text-lg leading-relaxed text-neutral-700 dark:text-cream/80">
                {doc.excerpt}
              </p>
            ) : null}

            {(displayDate || doc?.readTime) && (
              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-softGold/70">
                {displayDate ? <span>{displayDate}</span> : null}
                {doc?.readTime ? <span>• {doc.readTime}</span> : null}
              </div>
            )}

            {tags.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {tags.map((t) => (
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
            {locked ? (
              <section className="not-prose rounded-2xl border border-black/10 bg-white/70 p-6 dark:border-white/10 dark:bg-black/30">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl border border-black/10 bg-black/5 p-2 dark:border-white/10 dark:bg-white/5">
                    <Lock className="h-5 w-5 text-neutral-800 dark:text-cream/90" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-600 dark:text-softGold/80">
                      Inner Circle
                    </p>
                    <p className="text-sm leading-relaxed text-neutral-800 dark:text-cream/85">
                      {safeText(
                        doc?.lockMessage,
                        "This entry is reserved for Inner Circle members."
                      )}
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/inner-circle"
                        className="inline-flex items-center justify-center rounded-full bg-softGold px-4 py-2 text-xs font-semibold text-deepCharcoal hover:bg-softGold/90"
                      >
                        Join Inner Circle
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            ) : hasCode ? (
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