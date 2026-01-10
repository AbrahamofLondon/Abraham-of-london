import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import Head from "next/head";
import { useRouter } from "next/router";

import ContentlayerDocPage from "@/components/ContentlayerDocPage";

import {
  getAllContentlayerDocs,
  getDocBySlug,
  getDocHref,
  isDraftContent,
  normalizeSlug,
  toUiDoc,
  getContentlayerData,
  type DocBase as ContentDoc
} from "@/lib/contentlayer-compat";

import { prepareMDX } from "@/lib/server/md-utils";
import { sanitizeData } from "@/lib/server/md-utils";

type UiDoc = ReturnType<typeof toUiDoc>;

interface Props {
  doc: UiDoc;
  source: MDXRemoteSerializeResult;
  canonicalPath: string;
}

const ContentSlugPage: NextPage<Props> = ({ doc, source, canonicalPath }) => {
  const router = useRouter();

  // Enhanced loading state
  if (router.isFallback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-6" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">Loading the canon...</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Unpacking wisdom</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced 404 state
  if (!doc) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-black flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="relative mb-8">
            <div className="absolute -inset-4 bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-900/20 dark:to-pink-900/20 blur-2xl rounded-full opacity-60" />
            <div className="relative">
              <div className="text-6xl mb-4">🔍</div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">Manuscript Not Found</h1>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                This volume appears to have been misplaced from the archive.
              </p>
              <button
                onClick={() => router.push('/content')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <span>Return to Archive</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{doc.title} | Abraham of London Canon</title>
        <meta name="description" content={doc.description || doc.excerpt || "Part of the Abraham of London canon"} />
        <link rel="canonical" href={`https://abrahamoflondon.com${canonicalPath}`} />
        <meta property="og:title" content={doc.title} />
        <meta property="og:description" content={doc.description || doc.excerpt || ""} />
        <meta property="og:type" content="article" />
        {doc.coverImage && <meta property="og:image" content={doc.coverImage} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={doc.title} />
        <meta name="twitter:description" content={doc.description || doc.excerpt || ""} />
        {doc.coverImage && <meta name="twitter:image" content={doc.coverImage} />}
        {doc.date && <meta property="article:published_time" content={doc.date} />}
        {doc.author && <meta property="article:author" content={doc.author} />}
      </Head>
      
      <ContentlayerDocPage
        doc={doc}
        source={source}
        canonicalPath={canonicalPath}
        backHref="/content"
        label="Kingdom Vault"
      />
    </>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    // Get data first
    await getContentlayerData();
    
    // Get all documents
    const docs = await getAllContentlayerDocs();
    
    // Filter documents that belong to /content/ path
    const contentDocs = Array.isArray(docs) 
      ? docs.filter(doc => {
          if (!doc || isDraftContent(doc)) return false;
          const href = getDocHref(doc);
          return href && href.startsWith("/content/");
        })
      : [];

    // Generate paths safely
    const paths = contentDocs
      .map((doc) => {
        try {
          const href = getDocHref(doc);
          if (!href || !href.startsWith("/content/")) return null;
          
          const slug = normalizeSlug(href.replace(/^\/content\//, ""));
          return slug ? { params: { slug: slug.split('/').filter(Boolean) } } : null;
        } catch (error) {
          console.warn(`Error processing doc for path generation:`, doc?._id);
          return null;
        }
      })
      .filter(Boolean) as { params: { slug: string[] } }[];

    console.log(`📄 Content: Generated ${paths.length} paths from ${contentDocs.length} documents`);
    
    return { 
      paths, 
      fallback: 'blocking'
    };
  } catch (error) {
    console.error("Error generating static paths:", error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const rawSlug = params?.slug;
    
    // Validate slug
    if (!rawSlug) {
      return { notFound: true };
    }

    // Handle array slugs (for nested paths)
    const slug = Array.isArray(rawSlug) 
      ? rawSlug.join('/')
      : String(rawSlug);
    
    const normalizedSlug = normalizeSlug(slug);
    if (!normalizedSlug) {
      return { notFound: true };
    }

    // Get document by slug
    const rawDoc = await getDocBySlug(`content/${normalizedSlug}`);
    
    if (!rawDoc) {
      console.warn(`⚠️ Content not found for slug: content/${normalizedSlug}`);
      return { notFound: true };
    }

    // Check if document is a draft
    if (isDraftContent(rawDoc)) {
      console.warn(`⛔ Draft content accessed: content/${normalizedSlug}`);
      return { notFound: true };
    }

    // Convert to UI doc
    const doc = toUiDoc(rawDoc);
    
    // Get MDX source
    const rawMdx = rawDoc.body?.raw || rawDoc.body || "";
    const source = await prepareMDX(typeof rawMdx === "string" ? rawMdx : "");
    
    // Get canonical path
    const canonicalPath = getDocHref(rawDoc);

    return {
      props: {
        doc: sanitizeData(doc),
        source,
        canonicalPath,
      },
      revalidate: 1800,
    };
  } catch (error) {
    console.error("Error in getStaticProps for content/[slug]:", error);
    return {
      notFound: true,
    };
  }
};

export default ContentSlugPage;