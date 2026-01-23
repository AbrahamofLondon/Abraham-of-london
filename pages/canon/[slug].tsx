// pages/canon/[slug].tsx
// ✅ Pages Router (no 'use client')
// ✅ Public canons: compile at build time and ship MDXRemote payload
// ✅ Locked canons: ship metadata only; client fetches compiled MDXRemote payload from /api/canon/mdx
// ✅ Clean premium reading UX preserved

import React, { useEffect, useMemo, useState, useCallback } from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

import Layout from "@/components/Layout";
import CanonHero from "@/components/canon/CanonHero";
import CanonContent from "@/components/canon/CanonContent";
import CanonNavigation from "@/components/canon/CanonNavigation";
import CanonStudyGuide from "@/components/canon/CanonStudyGuide";
import AccessGate from "@/components/AccessGate";

import {
  getServerAllCanons,
  getServerCanonBySlug,
  getContentlayerData,
  normalizeSlug,
} from "@/lib/contentlayer-compat";

import { prepareMDX, mdxComponents, sanitizeData } from "@/lib/server/md-utils";

import { ChevronRight, Lock, BookOpen, Clock, Users, Sparkles } from "lucide-react";

// Enhanced reading UX for dense content
const ReadingProgress = dynamic(() => import("@/components/enhanced/ReadingProgress"), { ssr: false });
const TableOfContents = dynamic(() => import("@/components/enhanced/TableOfContents"), { ssr: false });
const ReadTime = dynamic(() => import("@/components/enhanced/ReadTime"), { ssr: false });
const BackToTop = dynamic(() => import("@/components/enhanced/BackToTop"), { ssr: false });

type Tier = "public" | "inner-circle" | "private";

type Canon = {
  title: string;
  excerpt: string | null;
  subtitle: string | null;
  slug: string;
  accessLevel: Tier;
  lockMessage: string | null;
  coverImage: string | null;
  volumeNumber?: string;
  order?: number;
  readTime?: string | number | null; // tolerate either; normalize before rendering if needed
  author?: string;
  date?: string;
  tags?: string[];
};

type Props = {
  canon: Canon;
  locked: boolean;
  source?: MDXRemoteSerializeResult; // present only when public
};

function asTier(v: unknown): Tier {
  if (v === "private") return "private";
  if (v === "inner-circle") return "inner-circle";
  return "public";
}

function getSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv && /^https?:\/\//.test(fromEnv)) return fromEnv.replace(/\/+$/, "");
  return "https://www.abrahamoflondon.org"; // safe fallback
}

const CanonPage: NextPage<Props> = ({ canon, locked, source }) => {
  const router = useRouter();

  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(source ?? null);
  const [busy, setBusy] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [showConversionPrompt, setShowConversionPrompt] = useState(false);

  const siteUrl = useMemo(() => getSiteUrl(), []);
  const canonicalUrl = `${siteUrl}/canon/${canon.slug}`;

  const metaDescription = canon.excerpt || "A canonical work from Abraham of London";
  const formattedDate = canon.date
    ? new Date(canon.date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })
    : "";

  const requiredLabel = useMemo(() => {
    if (canon.accessLevel === "private") return "Private";
    if (canon.accessLevel === "inner-circle") return "Inner Circle";
    return "Public";
  }, [canon.accessLevel]);

  const showGate = locked && !mdxSource;

  const fetchLockedMdx = useCallback(async () => {
    setGateError(null);
    setBusy(true);
    try {
      const r = await fetch(`/api/canon/mdx?slug=${encodeURIComponent(canon.slug)}`, { method: "GET" });
      const j = await r.json().catch(() => ({}));

      if (!r.ok || !j?.ok || !j?.source) {
        setGateError(j?.reason || "Access denied.");
        return;
      }

      // ✅ Already compiled on server (MDXRemoteSerializeResult)
      setMdxSource(j.source as MDXRemoteSerializeResult);
    } catch {
      setGateError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }, [canon.slug]);

  // If user already has a cookie, silently attempt to unlock on load (no modal spam).
  useEffect(() => {
    if (!locked) return;
    if (mdxSource) return;
    fetchLockedMdx().catch(() => {});
  }, [locked, mdxSource, fetchLockedMdx]);

  // Anonymous conversion prompt (only for public content)
  useEffect(() => {
    if (locked) return;
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      const denom = document.documentElement.scrollHeight - window.innerHeight;
      if (denom <= 0) return;
      const scrollPercent = (window.scrollY / denom) * 100;

      if (scrollPercent > 30 && scrollPercent < 35 && !showConversionPrompt) {
        setShowConversionPrompt(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [locked, showConversionPrompt]);

  return (
    <Layout>
      <Head>
        <title>{canon.title} | Canon | Abraham of London</title>
        <meta name="description" content={metaDescription} />

        <meta property="og:title" content={canon.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={canon.coverImage || "/assets/images/canon-default.jpg"} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />

        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      <ReadingProgress />

      {showGate && (
        <AccessGate
          title={canon.title}
          message={canon.lockMessage || `${requiredLabel} content. Enter your access key.`}
          requiredTier={canon.accessLevel}
          onUnlocked={() => {
            // /api/access/enter sets HttpOnly cookie; then fetch gated MDX from server
            fetchLockedMdx();
          }}
          onGoToJoin={() => router.push("/inner-circle")}
        />
      )}

      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
        {/* Top nav */}
        <div className="border-b border-gray-800 bg-black/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
            >
              <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
              Back to Canon
            </button>
          </div>
        </div>

        {/* Hero */}
        <CanonHero
          title={canon.title}
          subtitle={canon.subtitle}
          volumeNumber={canon.volumeNumber}
          coverImage={canon.coverImage}
          excerpt={canon.excerpt}
        />

        {/* Read time (guarded) */}
        {canon.readTime != null && String(canon.readTime).trim() !== "" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-8">
            <ReadTime minutes={canon.readTime as any} />
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left sidebar */}
            <div className="lg:col-span-3">
              <div className="sticky top-24 space-y-6">
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Navigation
                  </h3>
                  <CanonNavigation currentSlug={canon.slug} />
                </div>

                {locked && (
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-500/15 ring-1 ring-amber-500/30 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-amber-200" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{requiredLabel} Content</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {mdxSource ? "Unlocked on this browser." : "Enter key to unlock."}
                        </div>
                        {gateError && <div className="text-xs text-rose-400 mt-2">{gateError}</div>}
                        {busy && <div className="text-xs text-gray-400 mt-2">Verifying…</div>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main */}
            <main className="lg:col-span-6">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 md:p-8 lg:p-12">
                {/* Metadata row */}
                <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  {canon.author && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{canon.author}</span>
                    </div>
                  )}
                  {formattedDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{formattedDate}</span>
                    </div>
                  )}
                  {canon.readTime != null && String(canon.readTime).trim() !== "" && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{String(canon.readTime)} read</span>
                    </div>
                  )}
                </div>

                <CanonContent>
                  {mdxSource ? (
                    <MDXRemote {...mdxSource} components={mdxComponents} />
                  ) : (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full mb-4">
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-serif font-semibold text-white mb-3">Locked</h3>
                      <p className="text-gray-300 mb-6">
                        This canon requires {requiredLabel} access. Use your key to unlock.
                      </p>
                      <button
                        onClick={() => router.push("/inner-circle")}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all"
                      >
                        Join Inner Circle
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </CanonContent>

                {/* Tags */}
                {canon.tags && canon.tags.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-700">
                    <div className="flex flex-wrap gap-2">
                      {canon.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm rounded-full border border-gray-700 hover:border-amber-500/30 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversion prompt (public content only) */}
                {showConversionPrompt && !locked && (
                  <div className="mt-12 p-6 md:p-8 bg-gradient-to-br from-amber-900/30 to-amber-800/20 rounded-2xl border-2 border-amber-500/30 backdrop-blur-sm">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-serif font-semibold text-white mb-3">
                        Finding value in this?
                      </h3>
                      <p className="text-gray-300 mb-6 max-w-lg mx-auto">
                        Join the Inner Circle to access the complete canon, strategic frameworks, and private resources built
                        for serious builders.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                          onClick={() => router.push("/inner-circle")}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-900/50"
                        >
                          Join Inner Circle
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setShowConversionPrompt(false)}
                          className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                        >
                          Maybe later
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>

            {/* Right sidebar */}
            <div className="lg:col-span-3">
              <div className="sticky top-24 space-y-6">
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Contents
                  </h3>
                  <TableOfContents />
                </div>

                <CanonStudyGuide canonTitle={canon.title} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <BackToTop />
    </Layout>
  );
};

export default CanonPage;

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    await getContentlayerData();
    const canons: any[] = await getServerAllCanons();

    const paths = (canons || [])
      .filter((c) => c && !c.draft)
      .map((c) => {
        const slug = c.slug || c._raw?.flattenedPath?.replace(/^canon\//, "");
        return slug ? { params: { slug: normalizeSlug(String(slug)) } } : null;
      })
      .filter(Boolean) as { params: { slug: string } }[];

    return { paths, fallback: "blocking" };
  } catch (error) {
    console.error("Error generating static paths:", error);
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const slug = normalizeSlug(String(params?.slug || ""));
    if (!slug) return { notFound: true };

    const canonData: any = await getServerCanonBySlug(slug);
    if (!canonData || canonData.draft) return { notFound: true };

    const canon: Canon = {
      title: canonData.title || "Canon",
      excerpt: canonData.excerpt || null,
      subtitle: canonData.subtitle || null,
      slug: canonData.slug || slug,
      accessLevel: asTier(canonData.accessLevel),
      lockMessage: canonData.lockMessage || null,
      coverImage: canonData.coverImage || null,
      volumeNumber: canonData.volumeNumber,
      order: canonData.order,
      readTime: canonData.readTime || null,
      author: canonData.author,
      date: canonData.date,
      tags: canonData.tags,
    };

    // Public: compile at build-time
    if (canon.accessLevel === "public") {
      const rawMdx = String(canonData?.body?.raw ?? canonData?.body ?? "");
      const source = await prepareMDX(rawMdx);
      return {
        props: { canon: sanitizeData(canon), locked: false, source },
        revalidate: 1800,
      };
    }

    // Locked: do NOT ship MDX in props
    return {
      props: { canon: sanitizeData(canon), locked: true },
      revalidate: 1800,
    };
  } catch (error) {
    console.error("Error generating static props:", error);
    return { notFound: true };
  }
};