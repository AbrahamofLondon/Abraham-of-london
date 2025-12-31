// pages/[slug].tsx
import * as React from "react";
import Head from "next/head";
import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import {
  assertContentlayerHasDocs,
  getPublishedDocuments,
  getDocHref,
  getDocKind,
  normalizeSlug,
  resolveDocCoverImage,
  getAccessLevel,
  resolveDocDownloadUrl,
} from "@/lib/contentlayer-helper";

/* -------------------------------------------------------------------------- */
/* PREMIUM COMPONENTS                                                         */
/* -------------------------------------------------------------------------- */

interface ArticleHeroProps {
  title: string;
  subtitle?: string;
  category: string;
  date?: string | null;
  readTime?: string | null;
  coverImage?: string;
  coverAspect?: "book" | "wide" | "square";
  coverFit?: "cover" | "contain";
}

const ArticleHero: React.FC<ArticleHeroProps> = ({
  title,
  subtitle,
  category,
  date,
  readTime,
  coverImage,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    setIsVisible(true);
  }, []);

  const bg = coverImage || "/assets/images/writing-desk.webp";

  return (
    <section className="relative min-h-[70vh] overflow-hidden border-b border-[#2a2a2a]">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bg}
          alt=""
          className="h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-[#0a0a0a]/80 to-[#0a0a0a]" />
      </div>

      <div className="relative mx-auto flex min-h-[70vh] max-w-4xl items-end px-4 pb-16 pt-28">
        <div
          className={`transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="mb-4 inline-flex items-center gap-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#d4af37]" />
            <span className="text-xs tracking-[0.35em] uppercase text-[#d4af37]">
              {category}
            </span>
          </div>

          <h1 className="font-serif text-3xl font-semibold leading-tight text-cream sm:text-5xl">
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#ccc] sm:text-lg">
              {subtitle}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400">
            {date ? (
              <span>
                {new Date(date).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            ) : null}
            {readTime ? <span>• {readTime}</span> : null}
          </div>
        </div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN PAGE                                                                  */
/* -------------------------------------------------------------------------- */

type PageMeta = {
  slug?: string; // canonical root slug ONLY (single segment)
  url?: string; // canonical href from contentlayer-helper
  kind?: string;

  title: string;
  excerpt?: string | null;
  description?: string | null;

  category?: string | null;
  tags?: string[] | null;

  readTime?: string | number | null;
  date?: string | null;

  coverImage?: string | { src?: string } | null;
  coverAspect?: "book" | "wide" | "square";
  coverFit?: "cover" | "contain";

  accessLevel?: string;
  lockMessage?: string | null;

  author?: string | null;

  // Optional: useful for downloads/resources, etc.
  downloadUrl?: string | null;

  [key: string]: unknown;
};

type PageProps = {
  meta: PageMeta;
  mdxSource: MDXRemoteSerializeResult;
};

const SITE = "https://www.abrahamoflondon.org";

/* -------------------------------------------------------------------------- */
/* SLUG / ROUTE NORMALISATION                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Canonicalise any incoming slug-like value into a "single segment" slug:
 * - strips domain
 * - strips query/hash
 * - keeps last segment if path was provided
 */
function toCanonicalSingleSlug(input: unknown): string {
  let s = String(input ?? "").trim();
  if (!s) return "";

  s = s.split("#")[0]?.split("?")[0] ?? s;
  s = s.replace(/^https?:\/\/[^/]+/i, "");
  s = s.toLowerCase();
  s = s.replace(/\/+$/, "");
  s = s.replace(/^\/+/, "");
  if (!s) return "";

  const parts = s.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : s;
}

function isSingleSegmentHref(href: string): boolean {
  const clean = String(href ?? "")
    .trim()
    .split("#")[0]
    ?.split("?")[0]
    ?.trim();
  if (!clean) return false;

  const withoutTrailing = clean.replace(/\/+$/, "");
  const parts = withoutTrailing.split("/").filter(Boolean);
  // "/foo" -> ["foo"] ✅
  // "/blog/foo" -> ["blog","foo"] ❌
  return parts.length === 1;
}

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

function ContentPage({ meta, mdxSource }: PageProps): JSX.Element {
  const router = useRouter();

  const {
    title,
    description,
    excerpt,
    category,
    tags,
    date,
    readTime,
    coverImage,
    coverAspect,
    coverFit,
    accessLevel,
    lockMessage,
    slug,
    author,
    url,
    kind,
  } = meta;

  const [hasAccess, setHasAccess] = React.useState(false);
  const [checkedAccess, setCheckedAccess] = React.useState(false);
  const [isContentVisible, setIsContentVisible] = React.useState(false);

  React.useEffect(() => {
    setHasAccess(
      typeof document !== "undefined" &&
        document.cookie
          .split(";")
          .some((c) => c.trim().startsWith("innerCircleAccess=true")),
    );
    setCheckedAccess(true);

    const timer = window.setTimeout(() => setIsContentVisible(true), 300);
    return () => window.clearTimeout(timer);
  }, []);

  const displaySubtitle = excerpt || description || undefined;
  const primaryCategory =
    category || (Array.isArray(tags) && tags.length > 0 ? String(tags[0]) : "Content");

  const canonicalTitle = title || "";
  const displayDescription = description || excerpt || "";
  const effectiveSlug = slug || "";
  const canonicalPath = (url && String(url).startsWith("/")) ? String(url) : `/${effectiveSlug}`;
  const canonicalUrl = `${SITE}${canonicalPath}`;

  const isInnerCircle = accessLevel === "inner-circle";
  const isLocked = isInnerCircle && (!checkedAccess || !hasAccess);

  const returnToPath = canonicalPath;
  const joinUrl = `/inner-circle?returnTo=${encodeURIComponent(returnToPath)}`;

  const resolvedCoverImage =
    typeof coverImage === "string" ? coverImage : coverImage?.src || undefined;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": kind === "post" ? "Article" : "WebPage",
    headline: canonicalTitle,
    description: displayDescription,
    datePublished: date || new Date().toISOString(),
    dateModified: date || new Date().toISOString(),
    author: {
      "@type": "Person",
      name: author || "Abraham of London",
      url: SITE,
    },
    publisher: {
      "@type": "Organization",
      name: "Abraham of London",
    },
    ...(resolvedCoverImage ? { image: resolvedCoverImage } : {}),
  };

  return (
    <Layout
      title={canonicalTitle}
      description={displayDescription}
      canonicalUrl={canonicalUrl}
      ogImage={resolvedCoverImage}
      ogType={kind === "post" ? "article" : "website"}
      structuredData={structuredData}
      keywords={Array.isArray(tags) ? tags : []}
    >
      <Head>
        {resolvedCoverImage ? (
          <>
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
          </>
        ) : null}
      </Head>

      <ArticleHero
        title={title}
        subtitle={displaySubtitle}
        category={primaryCategory}
        date={date}
        readTime={typeof readTime === "number" ? `${readTime} min read` : readTime ?? null}
        coverImage={resolvedCoverImage}
        coverAspect={coverAspect}
        coverFit={coverFit}
      />

      {isInnerCircle ? (
        <div
          className={`mx-auto max-w-4xl px-4 pt-8 transition-all duration-1000 delay-300 ${
            isContentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="relative overflow-hidden rounded-xl border border-[#d4af37]/30 bg-gradient-to-r from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] p-6">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-[#d4af37]/10 to-transparent blur-2xl" />
            <div className="relative">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-2 w-2 animate-pulse rounded-full bg-[#d4af37]" />
                <div className="text-sm uppercase tracking-widest text-[#d4af37]">
                  Inner Circle Structure
                </div>
              </div>

              <p className="mb-6 leading-relaxed text-[#ccc]">
                {lockMessage ||
                  "This architectural framework is reserved for Inner Circle members. Unlock complete structural access."}
              </p>

              {!hasAccess ? (
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={joinUrl}
                    className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b8941f] px-6 py-3 text-sm font-medium text-black hover:opacity-90"
                  >
                    <span>Access Structure</span>
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </Link>

                  <Link
                    href="/inner-circle"
                    className="text-sm text-[#999] transition-colors hover:text-[#d4af37]"
                  >
                    Learn about Inner Circle
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <main
        className={`relative transition-all duration-1000 delay-500 ${
          isContentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/50 to-[#0a0a0a]" />
        </div>

        <article className="mx-auto max-w-4xl px-4 pb-32 pt-16">
          <div className="relative">
            <div className="absolute bottom-0 left-0 top-0 hidden w-32 -translate-x-40 lg:block">
              <div className="sticky top-32">
                <div className="relative">
                  <div className="h-px w-24 bg-gradient-to-r from-transparent to-[#3a3a3a]/50" />
                  <div className="mt-4 text-xs text-[#666]">Structural Depth</div>
                  <div className="mt-2 h-48 w-px bg-gradient-to-b from-[#d4af37]/30 via-transparent to-transparent" />
                </div>
              </div>
            </div>

            <div className="relative">
              {isInnerCircle && isLocked ? (
                <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] p-12 text-center">
                  <div className="mb-6 text-6xl opacity-10">𓃲</div>
                  <h3 className="mb-6 text-2xl font-light">
                    Architectural Framework Locked
                  </h3>
                  <p className="mx-auto mb-8 max-w-md leading-relaxed text-[#999]">
                    This structural analysis requires Inner Circle access. Join to unlock
                    the complete architectural framework.
                  </p>
                  <Link
                    href={joinUrl}
                    className="group inline-flex items-center gap-3 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b8941f] px-8 py-4 text-base font-medium text-black hover:opacity-90"
                  >
                    <span>Unlock Structure</span>
                    <span className="transition-transform group-hover:translate-x-2">
                      ↠
                    </span>
                  </Link>
                </div>
              ) : (
                <div
                  className="prose prose-lg max-w-none
                  prose-headings:font-light prose-headings:leading-tight
                  prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
                  prose-p:text-[#ccc] prose-p:leading-relaxed prose-p:text-base
                  prose-strong:text-[#fff] prose-strong:font-medium
                  prose-a:text-[#d4af37] prose-a:no-underline hover:prose-a:underline
                  prose-ul:text-[#ccc] prose-ol:text-[#ccc]
                  prose-li:marker:text-[#d4af37]/50
                  prose-blockquote:border-l-[#d4af37]/30 prose-blockquote:text-[#ccc] prose-blockquote:pl-6
                  prose-hr:border-[#2a2a2a] prose-hr:my-12
                  prose-img:rounded-xl prose-img:border prose-img:border-[#2a2a2a] prose-img:shadow-2xl
                  prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-[#2a2a3a] prose-pre:rounded-xl prose-pre:shadow-lg
                  prose-code:text-[#d4af37] prose-code:bg-[#1a1a1a] prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                  prose-table:text-[#ccc] prose-table:border prose-table:border-[#2a2a2a]
                  prose-th:border-b prose-th:border-[#2a2a2a] prose-th:text-[#d4af37]
                  prose-td:border-t prose-td:border-[#2a2a2a]"
                >
                  <MDXRemote {...mdxSource} components={mdxComponents} />
                </div>
              )}
            </div>

            <div className="absolute bottom-0 right-0 top-0 hidden w-48 translate-x-48 xl:block">
              <div className="sticky top-32">
                {Array.isArray(tags) && tags.length > 0 ? (
                  <div className="mb-8">
                    <div className="mb-3 text-xs uppercase tracking-widest text-[#666]">
                      Structural Tags
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.slice(0, 5).map((tag, index) => (
                        <span
                          key={index}
                          className="rounded border border-[#2a2a2a] px-2 py-1 text-xs text-[#999]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="border-t border-[#2a2a2a] pt-8">
                  <div className="mb-3 text-xs uppercase tracking-widest text-[#666]">
                    Reading Progress
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-[#2a2a2a]">
                    <div
                      id="aol-reading-progress"
                      className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8941f]"
                      style={{ width: "0%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <div className="border-t border-[#2a2a2a]">
          <div className="mx-auto max-w-4xl px-4 py-16">
            <div className="flex items-center justify-between">
              <Link
                href="/content"
                className="group flex items-center gap-3 text-sm text-[#999] transition-colors hover:text-[#d4af37]"
              >
                <span className="transition-transform group-hover:-translate-x-1">
                  ←
                </span>
                <span>Return to Collection</span>
              </Link>

              <div className="text-sm text-[#666]">Structural Layer Complete</div>
            </div>
          </div>
        </div>
      </main>

      <div className="pointer-events-none fixed inset-0 z-50">
        <div
          className="absolute h-64 w-64 rounded-full bg-gradient-to-r from-[#d4af37]/5 to-transparent blur-3xl"
          style={{
            transform: "translate(var(--mouse-x), var(--mouse-y))",
            transition: "transform 0.1s ease-out",
          }}
        />
      </div>

      <script
        // NOTE: This is intentionally inline (your current approach).
        // It's safe here because it uses only DOM APIs and does not interpolate user data.
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('mousemove', (e) => {
              document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
              document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');
            });

            window.addEventListener('scroll', () => {
              const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
              const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
              const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
              const progressBar = document.getElementById('aol-reading-progress');
              if (progressBar) {
                progressBar.style.width = scrolled + '%';
              }
            });
          `,
        }}
      />
    </Layout>
  );
}

/* -------------------------------------------------------------------------- */
/* STATIC GENERATION - REAL FIX                                                */
/* -------------------------------------------------------------------------- */

export const getStaticPaths: GetStaticPaths = async () => {
  assertContentlayerHasDocs("pages/[slug].tsx getStaticPaths");

  // KEY FIX:
  // This route MUST NOT generate /blog/*, /books/*, etc.
  // It is only for root-level single-segment slugs like:
  //   /fathering-without-fear
  // NOT:
  //   /blog/christianity-not-extremism
  const docs = getPublishedDocuments();

  const seen = new Set<string>();
  const paths = docs
    .map((doc) => {
      const href = getDocHref(doc);
      if (!href || !isSingleSegmentHref(href)) return null;

      const s = toCanonicalSingleSlug(href);
      if (!s) return null;

      if (seen.has(s)) return null;
      seen.add(s);

      return { params: { slug: s } };
    })
    .filter(Boolean) as { params: { slug: string } }[];

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  assertContentlayerHasDocs("pages/[slug].tsx getStaticProps");

  const requested = toCanonicalSingleSlug(params?.slug);
  if (!requested) return { notFound: true };

  const docs = getPublishedDocuments();

  // Find doc by canonical last-segment slug (stable across computed url/flattenedPath)
  const found =
    docs.find((d) => toCanonicalSingleSlug(normalizeSlug(d)) === requested) ??
    docs.find((d) => toCanonicalSingleSlug(getDocHref(d)) === requested) ??
    null;

  if (!found) return { notFound: true };

  const canonicalHref = getDocHref(found);

  // If content actually belongs under a base route (/blog, /books, /downloads, etc.),
  // DO NOT render it here. Permanently redirect to canonical.
  if (!isSingleSegmentHref(canonicalHref)) {
    return {
      redirect: {
        destination: canonicalHref,
        permanent: true,
      },
    };
  }

  const kind = getDocKind(found);
  const accessLevel = getAccessLevel(found);
  const cover = resolveDocCoverImage(found);

  const raw = String((found as any)?.body?.raw ?? "");
  let mdxSource: MDXRemoteSerializeResult;

  try {
    mdxSource = await serialize(raw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [[rehypeSlug], [rehypeAutolinkHeadings, { behavior: "wrap" }]],
      },
    });
  } catch (err) {
    // Avoid build hard-fail on a single broken MDX document.
    mdxSource = await serialize("Content is being prepared.");
  }

  const meta: PageMeta = {
    kind,
    url: canonicalHref,
    slug: requested,

    title: String((found as any)?.title ?? "Content"),
    description:
      (typeof (found as any)?.description === "string" ? (found as any).description : null) ??
      null,
    excerpt: (typeof (found as any)?.excerpt === "string" ? (found as any).excerpt : null) ?? null,

    category: (typeof (found as any)?.category === "string" ? (found as any).category : null) ?? null,
    tags: Array.isArray((found as any)?.tags) ? (found as any).tags : null,

    readTime:
      (typeof (found as any)?.readTime === "string" ? (found as any).readTime : null) ??
      (typeof (found as any)?.readingTime === "string" ? (found as any).readingTime : null) ??
      null,

    date: (found as any)?.date ? new Date((found as any).date).toISOString() : null,

    coverImage: cover,

    coverAspect: (found as any)?.coverAspect ?? undefined,
    coverFit: (found as any)?.coverFit ?? undefined,

    accessLevel,
    lockMessage: (typeof (found as any)?.lockMessage === "string" ? (found as any).lockMessage : null) ?? null,

    author: (typeof (found as any)?.author === "string" ? (found as any).author : null) ?? null,

    downloadUrl: resolveDocDownloadUrl(found),
  };

  // Ensure JSON-safe props (Next export can be picky)
  const safeMeta = JSON.parse(JSON.stringify(meta)) as PageMeta;

  return {
    props: {
      meta: safeMeta,
      mdxSource,
    },
    revalidate: 3600,
  };
};

export default ContentPage;
