/* pages/downloads/[slug].tsx - FIXED */
import React, { useMemo, useState } from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { MDXRemote } from "next-mdx-remote";
import Head from "next/head";
import Layout from "@/components/Layout";

// FIXED: Import from contentlayer-helper directly
import {
  getServerAllDownloads,
  getServerDownloadBySlug,
  sanitizeData,
} from "@/lib/contentlayer";

import { prepareMDX, mdxComponents } from "@/lib/server/md-utils";

import DownloadHero from "@/components/downloads/DownloadHero";
import DownloadContent from "@/components/downloads/DownloadContent";
import DownloadCard from "@/components/downloads/DownloadCard";
import RelatedDownloads from "@/components/downloads/RelatedDownloads";

// IMPORTANT: do NOT import useAuth if it reads browser APIs during SSR.
// If you must use it, wrap usage to run only in browser.
// import { useAuth } from "@/hooks/useAuth";

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
  // SSR-safe “auth”: default to not logged in during prerender.
  // If you need real auth gating, implement it client-side in useEffect.
  const isBrowser = typeof window !== "undefined";
  const user = null;

  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  // Only decide gating after mount/browser is available
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

                {/* If you have a DownloadForm, render it here conditionally */}
                {/* {showForm ? <DownloadForm ... /> : null} */}
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

export const getStaticPaths: GetStaticPaths = async () => {
  const downloads = await getServerAllDownloads();
  return {
    paths: downloads
.filter((x: any) => x && !(x as any).draft)
.filter((x: any) => {
  const slug = (x as any).slug || (x as any)._raw?.flattenedPath || "";
  return slug && !String(slug).includes("replace");
})
.map((d: any) => ({ params: { slug: d.slug } })),
    fallback: false, // ✅ REQUIRED for export
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  const data = await getServerDownloadBySlug(slug);

  if (!data) return { notFound: true };

  const source = await prepareMDX(data.body?.raw || data.body || " ");

  const download: Download = {
    title: data.title || "Untitled Transmission",
    excerpt: data.excerpt || null,
    description: data.description || null,
    category: data.category || "Strategic Resource",
    fileUrl: data.fileUrl || data.downloadUrl || null,
    slug: data.slug || slug,
    date: data.date || null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    fileSize: data.fileSize || null,
    fileFormat: data.fileFormat || null,
    requiresEmail: !!data.requiresEmail,
    coverImage: data.coverImage || null,
  };

  return {
    props: { download: sanitizeData(download), source },
  };
};


