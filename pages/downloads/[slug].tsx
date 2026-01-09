// pages/downloads/[slug].tsx - HIGH-INTENT CONVERSION EXPERIENCE
import React, { useMemo, useState, useEffect } from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { MDXRemote } from "next-mdx-remote";
import Head from "next/head";
import Layout from "@/components/Layout";
import dynamic from 'next/dynamic';

import {
  getAllDownloads,
  getDownloadBySlug,
  sanitizeData,
  getServerAllDownloads,
  getServerDownloadBySlug,
} from "@/lib/contentlayer-compat";

import { prepareMDX, mdxComponents } from "@/lib/server/md-utils";

// Enhanced components for high-intent conversion
const ReadingProgress = dynamic(
  () => import("@/components/enhanced/ReadingProgress"),
  { ssr: false }
);

const BackToTop = dynamic(
  () => import("@/components/enhanced/BackToTop"),
  { ssr: false }
);

const DownloadHero = dynamic(
  () => import('@/components/downloads/DownloadHero'),
  { ssr: true }
);

const DownloadCard = dynamic(
  () => import('@/components/downloads/DownloadCard'),
  { ssr: true }
);

const RelatedDownloads = dynamic(
  () => import('@/components/downloads/RelatedDownloads'),
  { ssr: true }
);

const DownloadContent = dynamic(
  () => import('@/components/downloads/DownloadContent'),
  { 
    ssr: false,
    loading: () => (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
        <div className="h-4 bg-zinc-800 rounded w-full"></div>
        <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
      </div>
    )
  }
);

interface Download {
  title: string;
  excerpt: string | null;
  description: string | null;
  category: string;
  fileUrl: string | null;
  slug: string;
  date: string | null;
  tags: string[];
  fileSize: string | null;
  fileFormat: string | null;
  requiresEmail: boolean;
  coverImage: string | null;
  body?: { raw: string; code: string };
}

interface Props {
  download: Download;
  source: MDXRemoteSerializeResult;
}

const DownloadPage: NextPage<Props> = ({ download, source }) => {
  const isBrowser = typeof window !== "undefined";
  const user = null; // Replace with actual auth

  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [showValuePrompt, setShowValuePrompt] = useState(false);
  const [email, setEmail] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Track engagement for conversion timing
  useEffect(() => {
    if (!user && isBrowser) {
      const timer = setTimeout(() => {
        // Show value prompt after 15 seconds of engagement
        setShowValuePrompt(true);
      }, 15000);

      return () => clearTimeout(timer);
    }
  }, [user, isBrowser]);

  useMemo(() => {
    if (!isBrowser) return;
    if (download.requiresEmail && !user) {
      setShowForm(true);
    }
  }, [isBrowser, download.requiresEmail, user]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Submit email to your backend
      const response = await fetch('/api/downloads/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          downloadSlug: download.slug,
          downloadTitle: download.title 
        }),
      });

      if (response.ok) {
        setShowSuccessMessage(true);
        setShowForm(false);
        // Proceed with download
        await handleDownload();
      }
    } catch (error) {
      console.error('Email submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (download.requiresEmail && !user && !showSuccessMessage) {
      setShowForm(true);
      return;
    }
    
    setIsSubmitting(true);
    
    setTimeout(() => {
      setDownloadStarted(true);
      setIsSubmitting(false);
      
      if (download.fileUrl && isBrowser) {
        const link = document.createElement('a');
        link.href = download.fileUrl;
        link.download = `${download.slug}.${download.fileFormat?.toLowerCase() || 'pdf'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Track download event
        if (window.gtag) {
          window.gtag('event', 'download', {
            event_category: 'Resource',
            event_label: download.title,
            value: download.slug,
          });
        }
      }
    }, 800);
  };

  const pageTitle = useMemo(() => {
    return `${download.title} | Abraham of London`;
  }, [download.title]);

  const pageDescription = useMemo(() => {
    return download.description || download.excerpt || "Download strategic resources from Abraham of London";
  }, [download.description, download.excerpt]);

  return (
    <Layout>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={download.title} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        {download.coverImage && (
          <meta property="og:image" content={download.coverImage} />
        )}
        {download.date && (
          <meta property="article:published_time" content={new Date(download.date).toISOString()} />
        )}
      </Head>

      <ReadingProgress />

      <div className="min-h-screen bg-[#050505] selection:bg-amber-500 selection:text-black">
        <DownloadHero
          title={download.title}
          category={download.category}
          coverImage={download.coverImage}
          tags={download.tags || []}
        />

        {/* Value prompt for engaged anonymous users */}
        {showValuePrompt && !user && !showForm && (
          <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-900/95 via-amber-800/95 to-amber-900/95 backdrop-blur-xl border-b border-amber-500/30">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
                    <svg className="w-6 h-6 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Want access to our complete resource library?</p>
                    <p className="text-sm text-amber-200">Join Inner Circle for unlimited downloads + exclusive frameworks</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.location.href = '/inner-circle'}
                    className="px-6 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap"
                  >
                    Learn More
                  </button>
                  <button
                    onClick={() => setShowValuePrompt(false)}
                    className="text-amber-200 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <main className="lg:col-span-8">
              <div className="rounded-3xl border border-white/5 bg-zinc-900/30 p-8 backdrop-blur-xl lg:p-12">
                <DownloadCard
                  title={download.title}
                  fileSize={download.fileSize || "Variable"}
                  fileFormat={download.fileFormat || "PDF"}
                  tags={download.tags || []}
                  date={download.date}
                  category={download.category}
                />

                {/* Success Message */}
                {showSuccessMessage && (
                  <div className="mt-8 p-6 bg-emerald-900/20 border border-emerald-500/30 rounded-xl">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-emerald-300 mb-2">Thank you!</h4>
                        <p className="text-emerald-100">
                          Your download has started. We've also sent you the download link via email, plus occasional updates on new resources.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="prose prose-invert prose-amber mt-8 max-w-none">
                  {download.body?.raw ? (
                    <DownloadContent>
                      <MDXRemote {...source} components={mdxComponents} />
                    </DownloadContent>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-zinc-400">No content available for this download.</p>
                    </div>
                  )}
                </div>

                {/* Download CTA Section */}
                <div className="mt-12 border-t border-white/10 pt-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Ready to Download</h3>
                      <p className="text-zinc-400">
                        {download.fileSize && `${download.fileSize} • `}
                        {download.fileFormat || "PDF Format"}
                      </p>
                    </div>
                    
                    <button
                      onClick={handleDownload}
                      disabled={isSubmitting || downloadStarted}
                      className="group relative w-full sm:w-auto min-w-[200px] rounded-xl bg-amber-500 px-10 py-4 font-bold text-black transition-all hover:bg-amber-400 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-900/50"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Preparing...
                        </span>
                      ) : downloadStarted ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Download Started
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-5 w-5 transition-transform group-hover:translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Now
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Email Form */}
                  {showForm && download.requiresEmail && !user && !showSuccessMessage && (
                    <div className="mt-6 p-6 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-xl backdrop-blur-sm">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-amber-300 mb-2">
                            One more step to access this resource
                          </h4>
                          <p className="text-zinc-300 text-sm mb-4">
                            Enter your email to download. We'll also send you occasional updates on new strategic resources.
                          </p>
                          <form className="space-y-4" onSubmit={handleEmailSubmit}>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="your@email.com"
                              className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                              required
                            />
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="w-full px-6 py-3 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50"
                            >
                              {isSubmitting ? 'Sending...' : 'Get Download Link'}
                            </button>
                          </form>
                          <p className="text-xs text-zinc-400 mt-3">
                            We respect your privacy. Unsubscribe anytime.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Post-download conversion prompt */}
                {downloadStarted && !user && (
                  <div className="mt-8 p-8 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl border-2 border-purple-500/30">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-serif font-semibold text-white mb-3">
                        Found this resource valuable?
                      </h3>
                      <p className="text-gray-300 mb-6 max-w-lg mx-auto">
                        Get instant access to 50+ strategic frameworks, worksheets, and playbooks. Plus exclusive Inner Circle content.
                      </p>
                      <a
                        href="/inner-circle"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl hover:from-purple-400 hover:to-blue-400 transition-all shadow-lg shadow-purple-900/50"
                      >
                        Explore Inner Circle
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </main>

            <aside className="lg:col-span-4 self-start lg:sticky lg:top-8">
              <div className="space-y-6">
                {/* Related Downloads */}
                <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
                  <h3 className="mb-4 text-lg font-bold text-white">
                    Related Intelligence
                  </h3>
                  <RelatedDownloads currentSlug={download.slug} />
                </div>

                {/* File Details */}
                <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
                  <h3 className="mb-4 text-lg font-bold text-white">
                    File Details
                  </h3>
                  <dl className="space-y-3">
                    {download.fileSize && (
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">File Size</dt>
                        <dd className="text-white font-medium">{download.fileSize}</dd>
                      </div>
                    )}
                    {download.fileFormat && (
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">Format</dt>
                        <dd className="text-white font-medium">{download.fileFormat}</dd>
                      </div>
                    )}
                    {download.date && (
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">Published</dt>
                        <dd className="text-white font-medium">
                          {new Date(download.date).toLocaleDateString('en-GB', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </dd>
                      </div>
                    )}
                    {download.tags && download.tags.length > 0 && (
                      <div className="pt-3 border-t border-white/10">
                        <dt className="text-zinc-400 mb-2">Tags</dt>
                        <dd className="flex flex-wrap gap-2">
                          {download.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-zinc-800 text-zinc-300 text-sm rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Share Section */}
                <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
                  <h3 className="mb-4 text-lg font-bold text-white">
                    Share This Resource
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {isBrowser && (
                      <>
                        <button
                          onClick={() => window.open(
                            `https://twitter.com/intent/tweet?text=${encodeURIComponent(download.title)}&url=${encodeURIComponent(window.location.href)}`,
                            '_blank'
                          )}
                          className="flex-1 min-w-[100px] px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a8cd8] transition-colors text-sm font-medium"
                        >
                          Twitter
                        </button>
                        <button
                          onClick={() => window.open(
                            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
                            '_blank'
                          )}
                          className="flex-1 min-w-[100px] px-4 py-2 bg-[#0077B5] text-white rounded-lg hover:bg-[#00669c] transition-colors text-sm font-medium"
                        >
                          LinkedIn
                        </button>
                        <button
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(window.location.href);
                            }
                          }}
                          className="flex-1 min-w-[100px] px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors text-sm font-medium"
                        >
                          Copy Link
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <BackToTop />
    </Layout>
  );
};

export default DownloadPage;

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const downloads = getServerAllDownloads();
    
    if (!downloads || downloads.length === 0) {
      return { paths: [], fallback: "blocking" };
    }

    const paths = downloads
      .filter((doc: any) => doc && !doc.draft)
      .filter((doc: any) => {
        const slug = doc.slug || doc._raw?.flattenedPath || "";
        return slug && !String(slug).includes("replace");
      })
      .map((doc: any) => ({
        params: { slug: doc.slug || doc._raw?.flattenedPath || "" },
      }));

    return { paths, fallback: "blocking" };
  } catch (error) {
    console.error("[getStaticPaths] Error:", error);
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  
  if (!slug) return { notFound: true };

  try {
    const data = await getServerDownloadBySlug(slug);
    
    if (!data) return { notFound: true };

    const source = await prepareMDX(data.body?.raw || data.body || " ");

    const download: Download = {
      title: data.title || "Untitled Transmission",
      excerpt: data.excerpt || null,
      description: data.description || null,
      category: data.category || "Strategic Resource",
      fileUrl: data.fileUrl || (data as any)?.downloadUrl || null,
      slug: data.slug || slug,
      date: data.date || null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      fileSize: data.fileSize || null,
      fileFormat: data.fileFormat || null,
      requiresEmail: !!data.requiresEmail,
      coverImage: data.coverImage || null,
      body: data.body,
    };

    return {
      props: { 
        download: sanitizeData(download), 
        source 
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error(`[getStaticProps] Error:`, error);
    return { notFound: true };
  }
};