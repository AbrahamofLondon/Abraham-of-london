/* pages/downloads/[slug].tsx - FIXED VERSION */
import React, { useMemo, useState } from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { MDXRemote } from "next-mdx-remote";
import Head from "next/head";
import Layout from "@/components/Layout";

// Import from contentlayer directly
import { allDownloads } from "contentlayer/generated";
// Import compatibility layer functions
import {
  getAllDownloads,
  getDownloadBySlug,
  sanitizeData,
  getServerAllDownloads,
  getServerDownloadBySlug,
} from "@/lib/contentlayer-compat";

import { prepareMDX, mdxComponents } from "@/lib/server/md-utils";

import DownloadHero from "@/components/downloads/DownloadHero";
import DownloadContent from "@/components/downloads/DownloadContent";
import DownloadCard from "@/components/downloads/DownloadCard";
import RelatedDownloads from "@/components/downloads/RelatedDownloads";

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
}

interface Props {
  download: Download;
  source: MDXRemoteSerializeResult;
}

const DownloadPage: NextPage<Props> = ({ download, source }) => {
  const isBrowser = typeof window !== "undefined";
  const user = null;

  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  useMemo(() => {
    if (!isBrowser) return;
    if (download.requiresEmail && !user) setShowForm(true);
  }, [isBrowser, download.requiresEmail, user]);

  const handleDownload = async () => {
    if (download.requiresEmail && !user) {
      setShowForm(true);
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setDownloadStarted(true);
      setIsSubmitting(false);
      if (download.fileUrl && typeof window !== "undefined") {
        window.open(download.fileUrl, "_blank");
      }
    }, 800);
  };

  return (
    <Layout>
      <Head>
        <title>{download.title} | Abraham of London</title>
      </Head>

      <div className="min-h-screen bg-[#050505] selection:bg-amber-500 selection:text-black">
        <DownloadHero
          title={download.title}
          category={download.category}
          coverImage={download.coverImage}
          tags={download.tags || []}
        />

        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <main className="lg:col-span-8">
              <div className="rounded-3xl border border-white/5 bg-zinc-900/30 p-8 backdrop-blur-xl lg:p-12">
                <DownloadCard
                  title={download.title}
                  fileSize={download.fileSize || "Variable"}
                  fileFormat={download.fileFormat || "PDF"}
                  tags={download.tags || []}
                />

                <div className="prose prose-invert prose-amber mt-8 max-w-none">
                  <DownloadContent>
                    <MDXRemote {...source} components={mdxComponents} />
                  </DownloadContent>
                </div>

                <div className="mt-12">
                  <button
                    onClick={handleDownload}
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-amber-500 px-10 py-4 font-bold text-black transition-all hover:bg-amber-400 disabled:opacity-50 sm:w-auto"
                  >
                    {isSubmitting
                      ? "Preparing..."
                      : downloadStarted
                        ? "Started"
                        : "Download Now"}
                  </button>
                </div>
              </div>
            </main>

            <aside className="lg:col-span-4 self-start lg:sticky lg:top-8">
              <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
                <h3 className="mb-4 text-lg font-bold text-white">
                  Related Intelligence
                </h3>
                <RelatedDownloads currentSlug={download.slug} />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DownloadPage;

// Fixed: getStaticPaths now uses the imported getAllDownloads function
export const getStaticPaths: GetStaticPaths = async () => {
  try {
    // Use the correctly imported function
    const downloads = await getAllDownloads();
    
    if (!downloads || downloads.length === 0) {
      console.warn("[getStaticPaths] No downloads found, generating minimal paths");
      return {
        paths: [],
        fallback: "blocking",
      };
    }

    const paths = downloads
      .filter((doc) => doc && !doc.draft)
      .filter((doc) => {
        const slug = doc.slug || doc._raw?.flattenedPath || "";
        return slug && !String(slug).includes("replace");
      })
      .map((doc) => ({
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

// Fixed: getStaticProps uses consistent function names
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  
  if (!slug) {
    console.error("[getStaticProps] No slug provided");
    return { notFound: true };
  }

  try {
    // Use the compatibility layer function
    const data = await getDownloadBySlug(slug);
    
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