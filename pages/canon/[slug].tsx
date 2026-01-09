/* pages/canon/[slug].tsx - PREMIUM READING EXPERIENCE */
import React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

import Layout from "@/components/Layout";
import { getServerAllCanons, getServerCanonBySlug, getContentlayerData } from "@/lib/contentlayer-compat";

import CanonHero from "@/components/canon/CanonHero";
import CanonContent from "@/components/canon/CanonContent";
import CanonNavigation from "@/components/canon/CanonNavigation";
import CanonStudyGuide from "@/components/canon/CanonStudyGuide";
import AccessGate from "@/components/AccessGate";
import { useAuth } from "@/hooks/useAuth";

// Central MDX utilities
import { prepareMDX, mdxComponents, sanitizeData } from "@/lib/server/md-utils";

// Enhanced reading experience components (critical for dense content)
const ReadingProgress = dynamic(
  () => import("@/components/enhanced/ReadingProgress"),
  { ssr: false }
);

const TableOfContents = dynamic(
  () => import("@/components/enhanced/TableOfContents"),
  { ssr: false }
);

const ReadTime = dynamic(
  () => import("@/components/enhanced/ReadTime"),
  { ssr: false }
);

const BackToTop = dynamic(
  () => import("@/components/enhanced/BackToTop"),
  { ssr: false }
);

type Canon = {
  title: string;
  excerpt: string | null;
  subtitle: string | null;
  slug: string;
  accessLevel: string;
  lockMessage: string | null;
  coverImage: string | null;
  volumeNumber?: string;
  order?: number;
  readTime?: string | null;
};

type Props = {
  canon: Canon;
  locked: boolean;
  source?: MDXRemoteSerializeResult;
};

const CanonPage: NextPage<Props> = ({ canon, locked, source }) => {
  const { user, isLoading } = useAuth();
  const [showConversionPrompt, setShowConversionPrompt] = React.useState(false);

  // Track reading progress to show conversion prompt at strategic moment
  React.useEffect(() => {
    if (!user && !locked) {
      const handleScroll = () => {
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        
        // Show conversion prompt at 30% scroll (engaged but not finished)
        if (scrollPercent > 30 && scrollPercent < 35 && !showConversionPrompt) {
          setShowConversionPrompt(true);
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [user, locked, showConversionPrompt]);

  const hasAccess = !locked || (!!user && user.accessLevel === "inner-circle");
  const metaDescription = canon.excerpt || "A canonical work from Abraham of London";

  if (locked && !hasAccess && !isLoading) {
    return (
      <Layout>
        <Head>
          <title>{canon.title} | Canon | Abraham of London</title>
          <meta name="description" content={metaDescription} />
        </Head>

        <AccessGate
          title={canon.title}
          message={canon.lockMessage || "This content is reserved for Inner Circle members."}
          requiredTier="inner-circle"
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{canon.title} | Canon | Abraham of London</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={canon.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={canon.coverImage || "/assets/images/canon-default.jpg"} />
        <meta property="og:type" content="article" />
      </Head>

      {/* Reading progress indicator - critical for long content */}
      <ReadingProgress />

      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        {/* Canon Hero Section */}
        <CanonHero
          title={canon.title}
          subtitle={canon.subtitle}
          volumeNumber={canon.volumeNumber}
          coverImage={canon.coverImage}
          excerpt={canon.excerpt}
        />

        {/* Read time estimate - sets expectations for dense content */}
        {canon.readTime && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-8">
            <ReadTime minutes={canon.readTime} />
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Navigation Sidebar */}
            <div className="lg:col-span-3">
              <div className="sticky top-24 space-y-6">
                <CanonNavigation currentSlug={canon.slug} />
                
                {/* Quick actions for returning users */}
                {user && (
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                    <h4 className="text-sm font-semibold text-gray-300 mb-3">Quick Actions</h4>
                    <div className="space-y-2">
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        Save for later
                      </button>
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Add note
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <main className="lg:col-span-6">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 lg:p-12">
                {locked && hasAccess && (
                  <div className="mb-8 p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-sm text-purple-200">Inner Circle Exclusive Content</p>
                    </div>
                  </div>
                )}

                <CanonContent>
                  {source ? <MDXRemote {...source} components={mdxComponents} /> : null}
                </CanonContent>

                {/* Conversion prompt for anonymous engaged readers */}
                {showConversionPrompt && !user && (
                  <div className="mt-12 p-8 bg-gradient-to-br from-amber-900/30 to-amber-800/20 rounded-2xl border-2 border-amber-500/30 backdrop-blur-sm">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-serif font-semibold text-white mb-3">
                        Finding value in this content?
                      </h3>
                      <p className="text-gray-300 mb-6 max-w-lg mx-auto">
                        Join the Inner Circle to access our complete canon, strategic frameworks, and exclusive resources built for serious builders.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                          href="/inner-circle"
                          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-900/50"
                        >
                          Join Inner Circle
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </a>
                        <button
                          onClick={() => setShowConversionPrompt(false)}
                          className="px-6 py-4 text-gray-400 hover:text-white transition-colors"
                        >
                          Maybe later
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-12 pt-8 border-t border-gray-700">
                  <div className="flex flex-wrap gap-4">
                    <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      Save to Library
                    </button>
                    <button className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download PDF
                    </button>
                    <button className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share Insight
                    </button>
                  </div>
                </div>
              </div>
            </main>

            {/* Enhanced Study Guide Sidebar with TOC */}
            <div className="lg:col-span-3">
              <div className="sticky top-24 space-y-6">
                {/* Table of Contents - essential for dense content */}
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
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

      {/* Back to top - essential for long content */}
      <BackToTop />
    </Layout>
  );
};

export default CanonPage;

export const getStaticPaths: GetStaticPaths = async () => {
  await getContentlayerData();
  const canons: any[] = await getServerAllCanons();

  const paths = (canons || [])
    .filter((c) => c && !c.draft)
    .map((c) => {
      const slug =
        (typeof c.slug === "string" && c.slug) ||
        (typeof c._raw?.flattenedPath === "string"
          ? c._raw.flattenedPath.replace(/^canon\//, "")
          : null);
      return slug ? { params: { slug } } : null;
    })
    .filter(Boolean) as { params: { slug: string } }[];

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  if (!slug) return { notFound: true };

  const canonData: any = await getServerCanonBySlug(slug);
  if (!canonData || canonData.draft) return { notFound: true };

  const canon: Canon = {
    title: canonData.title || "Canon",
    excerpt: canonData.excerpt || null,
    subtitle: canonData.subtitle || null,
    slug: canonData.slug || slug,
    accessLevel: canonData.accessLevel || "public",
    lockMessage: canonData.lockMessage || null,
    coverImage: canonData.coverImage || null,
    volumeNumber: canonData.volumeNumber,
    order: canonData.order,
    readTime: canonData.readTime || null,
  };

  if (canon.accessLevel !== "public") {
    return { props: { canon: sanitizeData(canon), locked: true }, revalidate: 1800 };
  }

  const rawMdx = canonData?.body?.raw ?? canonData?.body ?? "";
  const source = await prepareMDX(typeof rawMdx === "string" ? rawMdx : "");

  return {
    props: { canon: sanitizeData(canon), locked: false, source },
    revalidate: 1800,
  };
};