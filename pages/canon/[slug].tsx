// pages/canon/[slug].tsx — FIXED VERSION
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { MDXRemote } from "next-mdx-remote";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";

// ✅ Import existing components
import CanonReader from "@/components/canon/CanonReader";
import CanonHero from "@/components/canon/CanonHero";

// ✅ Server boundary (build-time only)
import { getServerAllCanons, getServerCanonBySlug } from "@/lib/content/server";

// ✅ Shared helpers (isomorphic)
import { sanitizeData, resolveDocCoverImage } from "@/lib/content/shared";

// ✅ Import mdxComponents directly from components
import mdxComponents from "@/components/mdx-components";

// ✅ MDX utilities (server-side only)
import { prepareMDX } from "@/lib/server/md-utils";

import { BookOpen, Clock, Users, Sparkles } from "lucide-react";

/* -----------------------------------------------------------------------------
  TYPES
----------------------------------------------------------------------------- */

type Tier = "public" | "inner-circle" | "private";

type CanonDoc = {
  title: string;
  excerpt?: string | null;
  description?: string | null;
  slug: string;
  href: string;
  accessLevel: Tier;
  date?: string | null;
  coverImage?: string | null;
  category?: string | null;
  tags?: string[];
  author?: string | null;
  readTime?: string | null;
  nav?: Array<{ title: string; href: string }>;
  nextDoc?: { title: string; href: string } | null;
  prevDoc?: { title: string; href: string } | null;
};

interface Props {
  doc: CanonDoc;
  locked: boolean;
  initialSource: MDXRemoteSerializeResult | null;
}

type ApiOk = {
  ok: true;
  tier: Tier;
  requiredTier: Tier;
  source: MDXRemoteSerializeResult;
};

type ApiFail = {
  ok: false;
  reason: string;
};

/* -----------------------------------------------------------------------------
  PAGE COMPONENT
----------------------------------------------------------------------------- */

const CanonSlugPage: NextPage<Props> = ({ doc, locked, initialSource }) => {
  const router = useRouter();
  const [source, setSource] = React.useState<MDXRemoteSerializeResult | null>(initialSource);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadLockedContent = async (): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/canon/${encodeURIComponent(doc.slug)}`, {
        method: "GET",
        headers: { "Accept": "application/json" },
      });

      const json = (await res.json()) as ApiOk | ApiFail;

      if (!res.ok || !json || (json as ApiFail).ok === false) {
        setError((json as ApiFail)?.reason || "Access denied");
        return false;
      }

      const ok = json as ApiOk;
      if (!ok.source?.compiledSource) {
        setError("Invalid payload");
        return false;
      }

      setSource(ok.source);
      return true;
    } catch (e) {
      setError("Failed to unlock content");
      return false;
    } finally {
      setLoading(false);
    }
  };

  if (router.isFallback) {
    return (
      <Layout title="Loading…">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-amber-400" />
          <p className="mt-6 text-gray-300">Loading canon entry…</p>
        </div>
      </Layout>
    );
  }

  const canonical = `https://abrahamoflondon.com/canon/${doc.slug}`;
  const ogImage = doc.coverImage || "/assets/images/social/og-image.jpg";
  const description = doc.description || doc.excerpt || "Canon entry from Abraham of London.";

  // Convert readTime to estimatedHours if needed
  const parseEstimatedHours = () => {
    if (!doc.readTime) return 0;
    
    // Check if readTime is in minutes (e.g., "5 min")
    const match = doc.readTime.match(/(\d+)\s*min/);
    if (match) {
      return parseInt(match[1]) / 60; // Convert minutes to hours
    }
    
    // Default to 2 hours if we can't parse
    return 2;
  };

  return (
    <Layout title={doc.title} description={description}>
      <Head>
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={doc.title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={doc.title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="robots" content={locked ? "noindex, nofollow" : "index, follow"} />
      </Head>

      <section className="min-h-screen bg-black">
        {/* Hero Section - Use existing CanonHero component with correct props */}
        <CanonHero
          title={doc.title}
          description={doc.description || doc.excerpt || ""}
          coverImage={doc.coverImage}
          category={doc.category || "Canon"}
          difficulty="intermediate" // Default value since not in your data
          estimatedHours={parseEstimatedHours()}
          version="1.0" // Default value
          tags={doc.tags || []}
          author={doc.author || "Abraham of London"}
          publishedDate={doc.date}
        />

        {/* Content Area */}
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid lg:grid-cols-4 gap-12">
            {/* Main Content Column */}
            <main className="lg:col-span-3">
              {/* Access Gate - only if locked AND no source yet */}
              {locked && !source && (
                <div className="mb-12">
                  <AccessGate
                    title={doc.title}
                    message={`This canon entry requires ${doc.accessLevel.replace("-", " ")} access.`}
                    requiredTier={doc.accessLevel}
                    onUnlocked={loadLockedContent}
                    onGoToJoin={() => router.push("/inner-circle")}
                  />
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex items-center gap-3 text-gray-400 mb-8">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  Verifying credentials & decrypting manuscript...
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              {/* MDX Content - Use existing CanonReader component */}
              {source && (
                <CanonReader source={source} components={mdxComponents} />
              )}

              {/* Navigation */}
              {(doc.prevDoc || doc.nextDoc) && (
                <div className="mt-16 border-t border-white/10 pt-8">
                  <div className="flex justify-between">
                    {doc.prevDoc && (
                      <a
                        href={doc.prevDoc.href}
                        className="group flex items-center gap-3 text-gray-400 hover:text-white transition-colors"
                      >
                        <svg className="w-5 h-5 transform rotate-180 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                        <div>
                          <div className="text-xs uppercase tracking-widest">Previous</div>
                          <div className="text-sm font-medium">{doc.prevDoc.title}</div>
                        </div>
                      </a>
                    )}
                    
                    {doc.nextDoc && (
                      <a
                        href={doc.nextDoc.href}
                        className="group flex items-center gap-3 text-gray-400 hover:text-white transition-colors ml-auto"
                      >
                        <div className="text-right">
                          <div className="text-xs uppercase tracking-widest">Next</div>
                          <div className="text-sm font-medium">{doc.nextDoc.title}</div>
                        </div>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </main>

            {/* Sidebar Column */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-8">
                {/* Metadata */}
                <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10">
                  <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <BookOpen size={16} /> Details
                  </h3>
                  <div className="space-y-4">
                    {doc.author && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Author</div>
                        <div className="text-sm text-white">{doc.author}</div>
                      </div>
                    )}
                    {doc.date && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Date</div>
                        <div className="text-sm text-white">
                          {new Date(doc.date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    )}
                    {doc.readTime && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Read Time</div>
                        <div className="text-sm text-white flex items-center gap-2">
                          <Clock size={14} /> {doc.readTime}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category & Tags */}
                {(doc.category || (doc.tags && doc.tags.length > 0)) && (
                  <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10">
                    <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles size={16} /> Taxonomy
                    </h3>
                    {doc.category && (
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Category</div>
                        <span className="inline-block px-3 py-1 rounded-full bg-gold/10 text-gold text-xs font-bold uppercase tracking-widest">
                          {doc.category}
                        </span>
                      </div>
                    )}
                    {doc.tags && doc.tags.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Tags</div>
                        <div className="flex flex-wrap gap-2">
                          {doc.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-block px-2 py-1 rounded bg-white/5 text-gray-300 text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Access Level */}
                <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10">
                  <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <Users size={16} /> Access
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      doc.accessLevel === 'public' ? 'bg-green-500' :
                      doc.accessLevel === 'inner-circle' ? 'bg-amber-500' :
                      'bg-red-500'
                    }`} />
                    <span className="text-sm text-white capitalize">
                      {doc.accessLevel.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
  BUILD: PATHS
----------------------------------------------------------------------------- */

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const canons = getServerAllCanons();
    
    const paths = canons
      .filter((doc: any) => {
        if (!doc) return false;
        // Skip drafts
        if (doc.draft === true) return false;
        // Skip content that is explicitly unpublished
        if (doc.published === false) return false;
        return true;
      })
      .map((doc: any) => {
        const slug = doc.slug || doc._raw?.flattenedPath?.replace(/^canon\//, '');
        return slug ? { params: { slug: String(slug) } } : null;
      })
      .filter(Boolean);

    console.log(`[canon/getStaticPaths] Generated ${paths.length} paths`);
    return { paths, fallback: "blocking" };
  } catch (error) {
    console.error("[canon/getStaticPaths] Error:", error);
    return { paths: [], fallback: "blocking" };
  }
};

/* -----------------------------------------------------------------------------
  BUILD: PROPS
----------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const slug = typeof params?.slug === "string" ? params.slug : "";

    console.log(`[canon/getStaticProps] Processing slug: ${slug}`);

    if (!slug) {
      console.warn("[canon/getStaticProps] Empty slug");
      return { notFound: true };
    }

    const rawDoc = getServerCanonBySlug(slug);
    if (!rawDoc) {
      console.warn(`[canon/getStaticProps] No document found: ${slug}`);
      return { notFound: true };
    }

    // Check if draft or unpublished
    if (rawDoc.draft === true || rawDoc.published === false) {
      console.warn(`[canon/getStaticProps] Document is draft/unpublished: ${slug}`);
      return { notFound: true };
    }

    console.log(`[canon/getStaticProps] Found canon: ${rawDoc.title}`);

    // Determine access level
    const accessLevel = (() => {
      const level = String(rawDoc.accessLevel || "inner-circle").toLowerCase().trim();
      if (level === "private" || level === "restricted") return "private";
      if (level === "inner-circle" || level === "members" || level === "member") return "inner-circle";
      return "public";
    })();

    const locked = accessLevel !== "public";

    // Prepare MDX only for public content
    let initialSource: MDXRemoteSerializeResult | null = null;
    if (!locked) {
      const rawMdx = String(rawDoc?.body?.raw ?? rawDoc?.body ?? rawDoc?.content ?? "");
      if (rawMdx.trim()) {
        initialSource = await prepareMDX(rawMdx);
        console.log(`[canon/getStaticProps] Successfully prepared MDX for: ${slug}`);
      }
    }

    // Build navigation (compute at build time)
    const allCanons = getServerAllCanons();
    const currentIndex = allCanons.findIndex((d: any) => {
      const docSlug = d.slug || d._raw?.flattenedPath?.replace(/^canon\//, '');
      return docSlug === slug;
    });

    const prevDoc = currentIndex > 0 ? allCanons[currentIndex - 1] : null;
    const nextDoc = currentIndex < allCanons.length - 1 ? allCanons[currentIndex + 1] : null;

    const doc: CanonDoc = {
      title: rawDoc.title || "Untitled Canon Entry",
      excerpt: rawDoc.excerpt || rawDoc.description || null,
      description: rawDoc.description || null,
      slug: rawDoc.slug || slug,
      href: `/canon/${rawDoc.slug || slug}`,
      accessLevel,
      date: rawDoc.date ? String(rawDoc.date) : null,
      coverImage: resolveDocCoverImage(rawDoc) || null,
      category: rawDoc.category || null,
      tags: Array.isArray(rawDoc.tags) ? rawDoc.tags : [],
      author: rawDoc.author || null,
      readTime: rawDoc.readTime || null,
      nav: Array.isArray(rawDoc.nav) ? rawDoc.nav : [],
      prevDoc: prevDoc ? {
        title: prevDoc.title,
        href: `/canon/${prevDoc.slug || ''}`
      } : null,
      nextDoc: nextDoc ? {
        title: nextDoc.title,
        href: `/canon/${nextDoc.slug || ''}`
      } : null,
    };

    return {
      props: sanitizeData({
        doc,
        locked,
        initialSource,
      }),
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    console.error("[canon/getStaticProps] Fatal error:", error);
    return { notFound: true };
  }
};

export default CanonSlugPage;