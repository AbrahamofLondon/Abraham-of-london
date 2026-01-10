/* pages/canon/[slug].tsx - PREMIUM READING EXPERIENCE */
import React, { useState, useEffect } from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
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

import {
  Bookmark,
  Download,
  Share2,
  MessageSquare,
  Lock,
  ChevronRight,
  BookOpen,
  Clock,
  Users,
  Sparkles
} from "lucide-react";

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
  author?: string;
  date?: string;
  tags?: string[];
};

type Props = {
  canon: Canon;
  locked: boolean;
  source?: MDXRemoteSerializeResult;
};

const CanonPage: NextPage<Props> = ({ canon, locked, source }) => {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [showConversionPrompt, setShowConversionPrompt] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Check authentication status and bookmarks
  const hasAccess = !locked || (!!user && user.accessLevel === "inner-circle");

  // Track reading progress and bookmarks
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check bookmarks
      try {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarkedCanons') || '[]');
        setIsBookmarked(bookmarks.includes(canon.slug));
      } catch (error) {
        console.error('Error parsing bookmarks:', error);
      }

      // Track reading progress for conversion prompt
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
    }
  }, [user, locked, showConversionPrompt, canon.slug]);

  const handleBookmark = () => {
    if (typeof window !== 'undefined') {
      try {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarkedCanons') || '[]');
        
        if (isBookmarked) {
          const updated = bookmarks.filter((slug: string) => slug !== canon.slug);
          localStorage.setItem('bookmarkedCanons', JSON.stringify(updated));
          setIsBookmarked(false);
        } else {
          bookmarks.push(canon.slug);
          localStorage.setItem('bookmarkedCanons', JSON.stringify(bookmarks));
          setIsBookmarked(true);
        }
      } catch (error) {
        console.error('Error updating bookmarks:', error);
      }
    }
  };

  const handleShare = async (platform?: string) => {
    const url = window.location.href;
    const title = canon.title;
    const text = canon.excerpt || 'Check out this canonical work from Abraham of London';

    try {
      if (platform === 'twitter') {
        const tweetUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        window.open(tweetUrl, '_blank');
      } else if (platform === 'linkedin') {
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        window.open(linkedinUrl, '_blank');
      } else if (navigator.share) {
        await navigator.share({
          title,
          text,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      if (!navigator.share) {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    }
    setShowShareOptions(false);
  };

  const metaDescription = canon.excerpt || "A canonical work from Abraham of London";
  const formattedDate = canon.date ? new Date(canon.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  if (locked && !hasAccess && !isLoading) {
    return (
      <Layout>
        <Head>
          <title>{canon.title} | Canon | Abraham of London</title>
          <meta name="description" content={metaDescription} />
          <meta property="og:title" content={canon.title} />
          <meta property="og:description" content={metaDescription} />
          <link rel="canonical" href={`https://abrahamoflondon.com/canon/${canon.slug}`} />
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
        <meta property="og:url" content={`https://abrahamoflondon.com/canon/${canon.slug}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={`https://abrahamoflondon.com/canon/${canon.slug}`} />
      </Head>

      {/* Reading progress indicator - critical for long content */}
      <ReadingProgress />

      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
        {/* Navigation */}
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Navigation Sidebar */}
            <div className="lg:col-span-3">
              <div className="sticky top-24 space-y-6">
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Navigation
                  </h3>
                  <CanonNavigation currentSlug={canon.slug} />
                </div>
                
                {/* Quick actions */}
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                  <h4 className="text-sm font-semibold text-gray-300 mb-4">Quick Actions</h4>
                  <div className="space-y-3">
                    <button
                      onClick={handleBookmark}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isBookmarked 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-amber-500/30 hover:text-amber-400'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                      <span className="text-sm">{isBookmarked ? 'Saved to Library' : 'Save for Later'}</span>
                    </button>
                    <button
                      onClick={() => {/* Implement notes functionality */}}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-blue-500/30 hover:text-blue-400 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">Add Note</span>
                    </button>
                    <button
                      onClick={() => setShowShareOptions(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-emerald-500/30 hover:text-emerald-400 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm">Share Insight</span>
                    </button>
                  </div>
                </div>

                {/* Share Options Modal */}
                {showShareOptions && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">Share This Canon</h3>
                        <button
                          onClick={() => setShowShareOptions(false)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleShare('twitter')}
                          className="flex flex-col items-center justify-center p-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-colors"
                        >
                          <svg className="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.213c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                          <span className="text-sm">Twitter</span>
                        </button>
                        <button
                          onClick={() => handleShare('linkedin')}
                          className="flex flex-col items-center justify-center p-4 bg-blue-700/10 hover:bg-blue-700/20 text-blue-300 rounded-xl transition-colors"
                        >
                          <svg className="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                          <span className="text-sm">LinkedIn</span>
                        </button>
                        <button
                          onClick={() => handleShare()}
                          className="col-span-2 flex items-center justify-center gap-3 p-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors"
                        >
                          <Share2 className="w-5 h-5" />
                          <span>Copy Link</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <main className="lg:col-span-6">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 md:p-8 lg:p-12">
                {locked && hasAccess && (
                  <div className="mb-8 p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <Lock className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <p className="text-sm text-purple-200">Inner Circle Exclusive Content</p>
                    </div>
                  </div>
                )}

                {/* Metadata */}
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
                  {canon.readTime && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{canon.readTime} read</span>
                    </div>
                  )}
                </div>

                <CanonContent>
                  {source ? <MDXRemote {...source} components={mdxComponents} /> : (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full mb-4">
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-serif font-semibold text-white mb-3">
                        Inner Circle Exclusive
                      </h3>
                      <p className="text-gray-300 mb-6">
                        This content is available to Inner Circle members only.
                      </p>
                      <button
                        onClick={() => router.push('/inner-circle')}
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

                {/* Conversion prompt for anonymous engaged readers */}
                {showConversionPrompt && !user && (
                  <div className="mt-12 p-6 md:p-8 bg-gradient-to-br from-amber-900/30 to-amber-800/20 rounded-2xl border-2 border-amber-500/30 backdrop-blur-sm">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-serif font-semibold text-white mb-3">
                        Finding value in this content?
                      </h3>
                      <p className="text-gray-300 mb-6 max-w-lg mx-auto">
                        Join the Inner Circle to access our complete canon, strategic frameworks, and exclusive resources built for serious builders.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                          onClick={() => router.push('/inner-circle')}
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

                {/* Action buttons */}
                <div className="mt-12 pt-8 border-t border-gray-700">
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={handleBookmark}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2"
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                      {isBookmarked ? 'Saved to Library' : 'Save to Library'}
                    </button>
                    <button
                      onClick={() => {/* Implement download functionality */}}
                      className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                    <button
                      onClick={() => setShowShareOptions(true)}
                      className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
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
                    <BookOpen className="w-4 h-4" />
                    Contents
                  </h3>
                  <TableOfContents />
                </div>

                <CanonStudyGuide canonTitle={canon.title} />

                {/* Related content */}
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Related Canons</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/canon/strategic-frameworks')}
                      className="w-full text-left p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700 hover:border-amber-500/30 transition-colors group"
                    >
                      <div className="text-xs text-amber-500 mb-1">Volume I</div>
                      <div className="text-sm text-white group-hover:text-amber-300">Strategic Frameworks</div>
                    </button>
                    <button
                      onClick={() => router.push('/canon/case-studies')}
                      className="w-full text-left p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700 hover:border-amber-500/30 transition-colors group"
                    >
                      <div className="text-xs text-amber-500 mb-1">Volume II</div>
                      <div className="text-sm text-white group-hover:text-amber-300">Case Studies</div>
                    </button>
                    <button
                      onClick={() => router.push('/canon/methodologies')}
                      className="w-full text-left p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700 hover:border-amber-500/30 transition-colors group"
                    >
                      <div className="text-xs text-amber-500 mb-1">Volume III</div>
                      <div className="text-sm text-white group-hover:text-amber-300">Methodologies</div>
                    </button>
                  </div>
                </div>
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
  try {
    await getContentlayerData();
    const canons: any[] = await getServerAllCanons();

    const paths = (canons || [])
      .filter((c) => c && !c.draft)
      .map((c) => {
        const slug = c.slug || c._raw?.flattenedPath?.replace(/^canon\//, '');
        return slug ? { params: { slug } } : null;
      })
      .filter(Boolean) as { params: { slug: string } }[];

    return { 
      paths, 
      fallback: 'blocking' 
    };
  } catch (error) {
    console.error('Error generating static paths:', error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
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
      author: canonData.author,
      date: canonData.date,
      tags: canonData.tags,
    };

    if (canon.accessLevel !== "public") {
      return { 
        props: { 
          canon: sanitizeData(canon), 
          locked: true 
        }, 
        revalidate: 1800 
      };
    }

    const rawMdx = canonData?.body?.raw ?? canonData?.body ?? "";
    const source = await prepareMDX(typeof rawMdx === "string" ? rawMdx : "");

    return {
      props: { 
        canon: sanitizeData(canon), 
        locked: false, 
        source 
      },
      revalidate: 1800,
    };
  } catch (error) {
    console.error('Error generating static props:', error);
    return {
      notFound: true
    };
  }
};