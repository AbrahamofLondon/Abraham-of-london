/* pages/[slug].tsx - HYDRATED CATCH-ALL ROUTE */
import * as React from "react";
import Head from "next/head";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

import Layout from "@/components/Layout";

// Import should include getContentlayerData:
import {
  getPublishedDocuments,
  getDocHref,
  getDocKind,
  normalizeSlug,
  resolveDocCoverImage,
  getAccessLevel,
  resolveDocDownloadUrl,
  assertContentlayerHasDocs,
  getContentlayerData, // THIS MUST BE HERE
} from "@/lib/contentlayer-compat";
import { prepareMDX, mdxComponents, sanitizeData } from "@/lib/server/md-utils";

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
    <section className="relative min-h-[70vh] overflow-hidden border-b border-zinc-800 bg-black">
      <div className="absolute inset-0">
        <img
          src={bg}
          alt=""
          className="h-full w-full object-cover opacity-30 grayscale transition-opacity duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black" />
      </div>

      <div className="relative mx-auto flex min-h-[70vh] max-w-4xl items-end px-4 pb-16 pt-28">
        <div
          className={`transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="mb-4 inline-flex items-center gap-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            <span className="text-xs font-bold uppercase tracking-[0.35em] text-amber-500">
              {category}
            </span>
          </div>

          <h1 className="font-serif text-4xl font-bold leading-tight text-white sm:text-6xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
              {subtitle}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-zinc-500">
            {date && (
              <span>
                {new Date(date).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
            {readTime && <span>• {readTime}</span>}
          </div>
        </div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* TYPES & CONSTANTS                                                          */
/* -------------------------------------------------------------------------- */

type PageMeta = {
  slug: string;
  url: string;
  kind: string;
  title: string;
  excerpt: string | null;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  readTime: string | null;
  date: string | null;
  coverImage: string | null;
  accessLevel: string;
  lockMessage: string | null;
  author: string | null;
  downloadUrl: string | null;
};

type PageProps = {
  meta: PageMeta;
  mdxSource: MDXRemoteSerializeResult;
};

const SITE = "https://www.abrahamoflondon.org";

function isSingleSegmentHref(href: string): boolean {
  const clean = String(href ?? "").split(/[?#]/)[0].replace(/\/+$/, "");
  const parts = clean.split("/").filter(Boolean);
  // Root paths only: "/about" ✅, "/blog/post" ❌
  return parts.length === 1;
}

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

const ContentPage: NextPage<PageProps> = ({ meta, mdxSource }) => {
  const [hasAccess, setHasAccess] = React.useState(false);
  const [isContentVisible, setIsContentVisible] = React.useState(false);

  React.useEffect(() => {
    setHasAccess(
      typeof document !== "undefined" &&
        document.cookie.includes("innerCircleAccess=true")
    );
    const timer = setTimeout(() => setIsContentVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const isLocked = meta.accessLevel === "inner-circle" && !hasAccess;
  const joinUrl = `/inner-circle?returnTo=${encodeURIComponent(meta.url)}`;

  return (
    <Layout
      title={meta.title}
      description={meta.description || meta.excerpt || ""}
      canonicalUrl={`${SITE}${meta.url}`}
      ogImage={meta.coverImage || undefined}
      ogType="article"
    >
      <ArticleHero
        title={meta.title}
        subtitle={meta.excerpt || meta.description || undefined}
        category={meta.category || (meta.tags?.[0]) || "Intelligence"}
        date={meta.date}
        readTime={meta.readTime}
        coverImage={meta.coverImage || undefined}
      />

      <main className={`relative transition-all duration-1000 delay-500 ${
          isContentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}>
        <article className="mx-auto max-w-4xl px-4 pb-32 pt-16">
          <div className="relative">
            {/* Structural Depth Indicator (Sidebar) */}
            <div className="absolute bottom-0 left-0 top-0 hidden w-32 -translate-x-44 lg:block">
              <div className="sticky top-32">
                <div className="h-px w-24 bg-zinc-800" />
                <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                  Structural Depth
                </div>
                <div className="mt-4 h-48 w-px bg-gradient-to-b from-amber-500/40 to-transparent" />
              </div>
            </div>

            {isLocked ? (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-12 text-center shadow-2xl">
                <div className="mb-6 text-6xl opacity-20 text-amber-500">𓃲</div>
                <h3 className="mb-4 font-serif text-3xl font-bold text-white">
                  Dossier Access Restricted
                </h3>
                <p className="mx-auto mb-10 max-w-md text-zinc-400">
                  {meta.lockMessage || "This architectural analysis is reserved for the Inner Circle. Unlock complete transmission access."}
                </p>
                <Link
                  href={joinUrl}
                  className="inline-flex items-center gap-3 rounded-xl bg-amber-500 px-10 py-4 font-bold text-black transition-all hover:scale-105 hover:bg-amber-400"
                >
                  Unlock Structure ↠
                </Link>
              </div>
            ) : (
              <div className="prose prose-invert prose-amber max-w-none 
                prose-headings:font-serif prose-headings:font-bold
                prose-p:text-zinc-300 prose-p:leading-relaxed
                prose-blockquote:border-l-amber-500/50 prose-blockquote:bg-zinc-900/30 prose-blockquote:p-6
                prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800">
                <MDXRemote {...mdxSource} components={mdxComponents} />
              </div>
            )}
          </div>
        </article>
      </main>

      {/* Reading Progress & UI Enhancement */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        <div 
          id="cursor-glow"
          className="absolute h-[500px] w-[500px] rounded-full bg-amber-500/5 blur-[120px]" 
        />
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            const glow = document.getElementById('cursor-glow');
            document.addEventListener('mousemove', (e) => {
              if(glow) {
                glow.style.left = e.clientX - 250 + 'px';
                glow.style.top = e.clientY - 250 + 'px';
              }
            });
          `,
        }}
      />
    </Layout>
  );
};

/* -------------------------------------------------------------------------- */
/* STATIC GENERATION                                                          */
/* -------------------------------------------------------------------------- */

export const getStaticPaths: GetStaticPaths = async () => {
  // FIXED: Call getContentlayerData first, then assert with the data
  const data = await getContentlayerData();
  assertContentlayerHasDocs(data); // PASS THE DATA
  
  const docs = getPublishedDocuments();

  const paths = docs
    .map((doc) => {
      const href = getDocHref(doc);
      // ONLY generate paths for single-segment URLs like /about
      if (!isSingleSegmentHref(href)) return null;
      return { params: { slug: normalizeSlug(doc.slug || doc._raw.flattenedPath) } };
    })
    .filter(Boolean) as { params: { slug: string } }[];

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const slug = String(params?.slug || "");
  
  // FIXED: Also call getContentlayerData in getStaticProps
  await getContentlayerData();
  
  const docs = getPublishedDocuments();

  const found = docs.find((d) => normalizeSlug(d.slug || d._raw.flattenedPath) === slug);
  if (!found) return { notFound: true };

  const canonicalHref = getDocHref(found);

  // REDIRECT GUARD: If it belongs in /blog, /books, etc., move it there.
  if (!isSingleSegmentHref(canonicalHref)) {
    return { redirect: { destination: canonicalHref, permanent: true } };
  }

  const mdxSource = await prepareMDX(found.body.raw || found.body || "");

  const meta: PageMeta = {
    slug,
    url: canonicalHref,
    kind: getDocKind(found),
    title: found.title || "Untitled",
    excerpt: found.excerpt || found.description || null,
    description: found.description || found.excerpt || null,
    category: (found as any).category || null,
    tags: (found as any).tags || null,
    readTime: (found as any).readTime || null,
    date: found.date ? new Date(found.date).toISOString() : null,
    coverImage: resolveDocCoverImage(found),
    accessLevel: getAccessLevel(found),
    lockMessage: (found as any).lockMessage || null,
    author: (found as any).author || "Abraham of London",
    downloadUrl: resolveDocDownloadUrl(found),
  };

  return {
    props: sanitizeData({ meta, mdxSource }),
    revalidate: 3600,
  };
};

export default ContentPage;