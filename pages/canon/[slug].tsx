// pages/canon/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import SiteLayout from "@/components/SiteLayout";
import mdxComponents from "@/components/mdx-components";
import LockClosedIcon from "@/components/icons/LockClosedIcon";

import {
  getPublicCanon, // Changed from getAllCanon
  getCanonBySlug,
  type Canon, // Changed from CanonDoc
} from "@/lib/canon";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CanonPageMeta = {
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
  date?: string | null;
  tags?: string[];
  volumeNumber?: number | null;
  order?: number | null;
  featured?: boolean;
  accessLevel?: string | null;
  lockMessage?: string | null;
};

type PageProps = {
  meta: CanonPageMeta;
  mdxSource: MDXRemoteSerializeResult;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function hasInnerCircleCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .some((part) => part.startsWith("innerCircleAccess=true"));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const CanonPage: NextPage<PageProps> = ({ meta, mdxSource }) => {
  const {
    slug,
    title,
    subtitle,
    description,
    excerpt,
    coverImage,
    date,
    tags = [],
    volumeNumber,
    featured,
    accessLevel,
    lockMessage,
  } = meta;

  const [hasAccess, setHasAccess] = React.useState(false);
  const [checkedAccess, setCheckedAccess] = React.useState(false);

  React.useEffect(() => {
    setHasAccess(hasInnerCircleCookie());
    setCheckedAccess(true);
  }, []);

  const isInnerCircle = accessLevel === "inner-circle";
  const isLocked = isInnerCircle && (!checkedAccess || !hasAccess);

  const displaySubtitle =
    subtitle || description || excerpt || "Canon Volume";
  const primaryTag =
    tags[0] ||
    (volumeNumber ? `Volume ${volumeNumber}` : "Canon Entry");

  const catalogueDate =
    date && !Number.isNaN(new Date(date).getTime())
      ? new Date(date).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";
  const canonicalUrl = `${SITE_URL}/canon/${slug}`;

  const joinUrl = `/inner-circle?returnTo=${encodeURIComponent(
    `/canon/${slug}`
  )}`;

  return (
    <SiteLayout
      pageTitle={title}
      metaDescription={description || excerpt || displaySubtitle}
    >
      <Head>
        <title>{`${title} | Canon | Abraham of London`}</title>
        <meta
          name="description"
          content={description || excerpt || displaySubtitle}
        />
        <link rel="canonical" href={canonicalUrl} />

        <meta
          property="og:title"
          content={`${title} | Canon | Abraham of London`}
        />
        <meta
          property="og:description"
          content={description || excerpt || displaySubtitle}
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        {coverImage && <meta property="og:image" content={coverImage} />}
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-charcoal text-cream">
        {/* Hero */}
        <section className="relative border-b border-white/10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 -top-40 h-72 bg-[radial-gradient(circle_at_top,_rgba(226,197,120,0.18),_transparent_70%)]" />
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-softGold/70 via-softGold/0 to-transparent" />
            <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-t from-softGold/50 via-softGold/0 to-transparent" />
          </div>

          <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-12 pt-16 md:flex-row md:items-end md:pb-16 md:pt-20">
            {/* Left: Text */}
            <div className="flex-1 space-y-5">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-softGold/80">
                Canon ·{" "}
                {volumeNumber ? `Volume ${volumeNumber}` : "Catalogue Entry"}
              </p>

              <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl md:text-5xl">
                {title}
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base">
                {displaySubtitle}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 sm:text-[0.8rem]">
                {catalogueDate && (
                  <span>Catalogued · {catalogueDate}</span>
                )}
                {primaryTag && (
                  <>
                    <span className="h-4 w-px bg-white/20" />
                    <span className="uppercase tracking-[0.18em] text-softGold/80">
                      {primaryTag}
                    </span>
                  </>
                )}
                {featured && (
                  <>
                    <span className="h-4 w-px bg-white/20" />
                    <span className="inline-flex items-center gap-1 text-softGold">
                      <span className="text-xs">★</span> Featured Volume
                    </span>
                  </>
                )}
                {isInnerCircle && (
                  <>
                    <span className="h-4 w-px bg-white/20" />
                    <span className="inline-flex items-center gap-1 text-softGold">
                      <LockClosedIcon className="h-3 w-3" />
                      Inner Circle
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right: "Shelf card" */}
            <div className="w-full max-w-xs rounded-3xl border border-white/10 bg-black/40 px-5 py-5 shadow-[0_18px_40px_rgba(0,0,0,0.85)] backdrop-blur-sm">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-softGold/80">
                Shelf Reference
              </p>

              <div className="mt-3 space-y-3 text-xs text-gray-300">
                {volumeNumber && (
                  <p>
                    <span className="text-softGold/80">Volume:</span>{" "}
                    {volumeNumber}
                  </p>
                )}
                <p>
                  <span className="text-softGold/80">Slug:</span> {slug}
                </p>
                {tags.length > 0 && (
                  <p>
                    <span className="text-softGold/80">Tags:</span>{" "}
                    {tags.join(" · ")}
                  </p>
                )}
              </div>

              {isInnerCircle && (
                <div className="mt-4 rounded-2xl border border-softGold/40 bg-softGold/10 px-4 py-3 text-[0.75rem] text-softGold">
                  <p className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em]">
                    Restricted Canon
                  </p>
                  <p>
                    This volume is catalogued under the Inner Circle. Full text
                    is reserved for members.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="mx-auto max-w-4xl px-4 pb-24 pt-10">
          {isInnerCircle && isLocked ? (
            <div className="rounded-3xl border border-softGold/50 bg-black/70 px-8 py-14 text-center shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-sm">
              <div className="mb-6 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-softGold/15 text-softGold">
                  <LockClosedIcon className="h-6 w-6" />
                </div>
              </div>
              <h2 className="font-serif text-2xl font-semibold text-cream sm:text-3xl">
                Inner Circle Volume
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-gray-200 sm:text-base">
                {lockMessage ||
                  "This Canon entry is reserved for Inner Circle members. It sits in the restricted shelf — where strategy, theology, and lived experience are handled with more precision and less politeness."}
              </p>
              <div className="mt-8 flex justify-center">
                <Link
                  href={joinUrl}
                  className="inline-flex items-center gap-2 rounded-full bg-softGold px-8 py-3 text-sm font-semibold text-black transition-all hover:bg-softGold/90 hover:shadow-xl hover:shadow-softGold/40"
                >
                  <span>⚡</span>
                  Join the Inner Circle
                </Link>
              </div>
            </div>
          ) : (
            <article
              className="
                prose prose-invert prose-lg max-w-none
                prose-headings:font-serif prose-headings:text-cream
                prose-h1:text-4xl prose-h1:mb-6
                prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4
                prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3
                prose-p:text-gray-200 prose-p:leading-relaxed
                prose-strong:text-cream prose-strong:font-semibold
                prose-em:text-gray-300
                prose-a:text-softGold prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-softGold/60 prose-blockquote:text-gray-100
                prose-blockquote:bg-black/40 prose-blockquote:px-6 prose-blockquote:py-4
                prose-blockquote:rounded-r-3xl
                prose-hr:border-gray-700
                prose-img:rounded-2xl prose-img:shadow-2xl
              "
            >
              <MDXRemote {...mdxSource} components={mdxComponents} />
            </article>
          )}

          <div className="mt-16 border-t border-white/10 pt-8 text-xs text-gray-400">
            <p>
              Catalogued as part of the{" "}
              <Link
                href="/canon"
                className="text-softGold hover:text-softGold/80"
              >
                Abraham of London Canon
              </Link>
              . Built for fathers, founders, and stewards who think in
              generations.
            </p>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
};

export default CanonPage;

// ---------------------------------------------------------------------------
// Static Generation
// ---------------------------------------------------------------------------

export const getStaticPaths: GetStaticPaths = async () => {
  const docs: Canon[] = getPublicCanon(); // Changed from getAllCanon({ includeDrafts: false })

  const paths =
    docs
      .filter((doc) => doc.slug)
      .map((doc) => ({
        params: { slug: doc.slug },
      })) ?? [];

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const slugParam = params?.slug;
  const slug =
    typeof slugParam === "string"
      ? slugParam
      : Array.isArray(slugParam)
        ? slugParam[0]
        : "";

  if (!slug) return { notFound: true };

  const match = getCanonBySlug(slug);
  if (!match) return { notFound: true };

  const vol = toNumberOrNull(
    (match as unknown as { volumeNumber?: unknown }).volumeNumber
  );

  const meta: CanonPageMeta = {
    slug: match.slug,
    title: match.title ?? "Canon Volume",
    subtitle: (match as any).subtitle ?? null,
    description: match.description ?? null,
    excerpt: match.excerpt ?? null,
    coverImage: match.coverImage ?? null,
    date: match.date ?? null,
    tags: Array.isArray(match.tags) ? match.tags : [],
    volumeNumber: vol,
    order:
      typeof (match as any).order === "number" ? (match as any).order : null,
    featured: Boolean((match as any).featured),
    accessLevel: (match as any).accessLevel ?? null,
    lockMessage: (match as any).lockMessage ?? null,
  };

  const raw = (match as any).body?.raw ?? "";
  const clean = raw.trim();

  const mdxSource = await serialize(clean || "# Draft Canon Entry", {
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [],
    },
    scope: meta as unknown as Record<string, unknown>,
  });

  return {
    props: {
      meta,
      mdxSource,
    },
    revalidate: 1800,
  };
};