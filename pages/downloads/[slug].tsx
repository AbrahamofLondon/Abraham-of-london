// pages/downloads/[slug].tsx - FULLY FIXED VERSION
import React, { useMemo, useState } from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { MDXRemote } from "next-mdx-remote";
import Head from "next/head";
import Layout from "@/components/Layout";
import dynamic from 'next/dynamic';

// Import compatibility layer functions
import {
  getAllDownloads,
  getDownloadBySlug,
  sanitizeData,
  getServerAllDownloads,
  getServerDownloadBySlug,
} from "@/lib/contentlayer-compat";

import { prepareMDX, mdxComponents } from "@/lib/server/md-utils";

// Dynamically import components to prevent CSS import issues on server
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

// CRITICAL: DownloadContent imports DownloadCTA which has SCSS
const DownloadContent = dynamic(
  () => import('@/components/downloads/DownloadContent'),
  { 
    ssr: false, // Must be false to avoid SCSS import on server
    loading: () => (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
        <div className="h-4 bg-zinc-800 rounded w-full"></div>
        <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
        <div className="h-40 bg-zinc-800 rounded mt-8"></div>
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
  body?: {
    raw: string;
    code: string;
  };
}

interface Props {
  download: Download;
  source: MDXRemoteSerializeResult;
}

const DownloadPage: NextPage<Props> = ({ download, source }) => {
  const isBrowser = typeof window !== "undefined";
  const user = null; // Replace with actual auth context if needed

  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  useMemo(() => {
    if (!isBrowser) return;
    if (download.requiresEmail && !user) {
      setShowForm(true);
    }
  }, [isBrowser, download.requiresEmail, user]);

  const handleDownload = async () => {
    if (download.requiresEmail && !user) {
      setShowForm(true);
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate download preparation
    setTimeout(() => {
      setDownloadStarted(true);
      setIsSubmitting(false);
      
      // Trigger actual download
      if (download.fileUrl && isBrowser) {
        const link = document.createElement('a');
        link.href = download.fileUrl;
        link.download = `${download.slug}.${download.fileFormat?.toLowerCase() || 'pdf'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }, 800);
  };

  // Generate page metadata
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
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={download.title} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        {download.coverImage && (
          <meta property="og:image" content={download.coverImage} />
        )}
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={download.title} />
        <meta name="twitter:description" content={pageDescription} />
        {download.coverImage && (
          <meta name="twitter:image" content={download.coverImage} />
        )}
        
        {/* Additional Meta Tags */}
        {download.date && (
          <meta property="article:published_time" content={new Date(download.date).toISOString()} />
        )}
        {download.tags && download.tags.map((tag, index) => (
          <meta key={index} property="article:tag" content={tag} />
        ))}
        <meta property="article:section" content={download.category} />
      </Head>

      <div className="min-h-screen bg-[#050505] selection:bg-amber-500 selection:text-black">
        {/* Hero Section */}
        <DownloadHero
          title={download.title}
          category={download.category}
          coverImage={download.coverImage}
          tags={download.tags || []}
        />

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Left Column - Main Content */}
            <main className="lg:col-span-8">
              <div className="rounded-3xl border border-white/5 bg-zinc-900/30 p-8 backdrop-blur-xl lg:p-12">
                {/* Download Info Card */}
                <DownloadCard
                  title={download.title}
                  fileSize={download.fileSize || "Variable"}
                  fileFormat={download.fileFormat || "PDF"}
                  tags={download.tags || []}
                  date={download.date}
                  category={download.category}
                />

                {/* Download Content */}
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

                {/* Download Button Section */}
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
                      className="group relative w-full sm:w-auto min-w-[200px] rounded-xl bg-amber-500 px-10 py-4 font-bold text-black transition-all hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Now
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Email Form (if required) */}
                  {showForm && download.requiresEmail && !user && (
                    <div className="mt-6 p-6 border border-amber-500/20 bg-amber-500/5 rounded-xl">
                      <h4 className="text-lg font-semibold text-amber-300 mb-3">
                        Email Required for Download
                      </h4>
                      <p className="text-zinc-300 mb-4">
                        This resource requires email verification. Please enter your email to proceed.
                      </p>
                      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                        <input
                          type="email"
                          placeholder="your@email.com"
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                          required
                        />
                        <button
                          type="submit"
                          className="w-full px-6 py-3 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors"
                        >
                          Get Download Link
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </main>

            {/* Right Column - Sidebar */}
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
                    {download.category && (
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">Category</dt>
                        <dd className="text-white font-medium">{download.category}</dd>
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
                              // You could add a toast notification here
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
    </Layout>
  );
};

export default DownloadPage;

// Static Paths Generation
export const getStaticPaths: GetStaticPaths = async () => {
  try {
    // Use server-compatible function
    const downloads = getServerAllDownloads();
    
    if (!downloads || downloads.length === 0) {
      console.warn("[getStaticPaths] No downloads found, generating minimal paths");
      return {
        paths: [],
        fallback: "blocking",
      };
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

    console.log(`[getStaticPaths] Generated ${paths.length} paths for downloads`);
    
    return {
      paths,
      fallback: "blocking",
    };
  } catch (error) {
    console.error("[getStaticPaths] Error generating paths:", error);
    // Fallback to empty paths on error
    return {
      paths: [],
      fallback: "blocking",
    };
  }
};

// Static Props Generation
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  
  if (!slug) {
    console.error("[getStaticProps] No slug provided");
    return { notFound: true };
  }

  try {
    // Use server-compatible function
    const data = await getServerDownloadBySlug(slug);
    
    if (!data) {
      console.warn(`[getStaticProps] No download found for slug: ${slug}`);
      return { notFound: true };
    }

    // Prepare MDX content
    const source = await prepareMDX(data.body?.raw || data.body || " ");

    // Map data to Download interface
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
      // Revalidate every hour
      revalidate: 3600,
    };
  } catch (error) {
    console.error(`[getStaticProps] Error processing download ${slug}:`, error);
    return { notFound: true };
  }
};