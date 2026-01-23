// pages/content/[...slug].tsx — CONTENT VAULT DOC ROUTE (CATCH-ALL, LINK-SAFE)
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
} from "@/lib/contentlayer-compat";

import { prepareMDX } from "@/lib/server/md-utils";
import { sanitizeData } from "@/lib/server/md-utils";

type UiDoc = ReturnType<typeof toUiDoc>;

interface Props {
  doc: UiDoc;
  source: MDXRemoteSerializeResult;
  canonicalPath: string;
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

const ContentSlugPage: NextPage<Props> = ({ doc, source, canonicalPath }) => {
  const router = useRouter();

  // Loading state
  if (router.isFallback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-6" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                Loading the vault…
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">
                Unpacking assets
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Hard 404 UI (should rarely happen because getStaticProps returns notFound)
  if (!doc) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-black flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="relative mb-8">
            <div className="absolute -inset-4 bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-900/20 dark:to-pink-900/20 blur-2xl rounded-full opacity-60" />
            <div className="relative">
              <div className="text-6xl mb-4">🔍</div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">
                Manuscript Not Found
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                This asset isn’t in the vault index.
              </p>
              <button
                onClick={() => router.push("/content")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <span>Return to Vault</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canonicalUrl = `${SITE_URL}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`;

  const desc =
    doc.description || doc.excerpt || "Part of the Abraham of London vault";

  return (
    <>
      <Head>
        <title>{doc.title} | Abraham of London</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:title" content={doc.title} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        {doc.coverImage ? <meta property="og:image" content={doc.coverImage} /> : null}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={doc.title} />
        <meta name="twitter:description" content={desc} />
        {doc.coverImage ? <meta name="twitter:image" content={doc.coverImage} /> : null}

        {doc.date ? <meta property="article:published_time" content={doc.date} /> : null}
        {doc.author ? <meta property="article:author" content={doc.author} /> : null}
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
    await getContentlayerData();

    const docs = await getAllContentlayerDocs();

    // Only docs whose href begins with /content/
    const contentDocs = Array.isArray(docs)
      ? docs.filter((d) => {
          if (!d || isDraftContent(d)) return false;
          const href = getDocHref(d);
          return Boolean(href) && href.startsWith("/content/");
        })
      : [];

    const paths = contentDocs
      .map((doc) => {
        const href = getDocHref(doc);
        if (!href || !href.startsWith("/content/")) return null;

        // slug segments after /content/
        const rest = normalizeSlug(href.replace(/^\/content\//, ""));
        if (!rest) return null;

        const parts = rest.split("/").filter(Boolean);
        if (parts.length === 0) return null;

        return { params: { slug: parts } };
      })
      .filter(Boolean) as { params: { slug: string[] } }[];

    console.log(
      `📄 /content: Generated ${paths.length} paths from ${contentDocs.length} documents`
    );

    return { paths, fallback: "blocking" };
  } catch (error) {
    console.error("Error generating static paths for /content:", error);
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const raw = params?.slug;
    if (!raw) return { notFound: true };

    // catch-all always arrives as string[]
    const joined = Array.isArray(raw) ? raw.join("/") : String(raw);
    const normalized = normalizeSlug(joined);
    if (!normalized) return { notFound: true };

    // Strictly resolve content documents only
    const rawDoc = await getDocBySlug(`content/${normalized}`);
    if (!rawDoc) return { notFound: true };
    if (isDraftContent(rawDoc)) return { notFound: true };

    // Integrity check: the document must belong to /content/
    const href = getDocHref(rawDoc);
    if (!href || !href.startsWith("/content/")) return { notFound: true };

    const doc = toUiDoc(rawDoc);

    const rawMdx = rawDoc.body?.raw || rawDoc.body || "";
    const source = await prepareMDX(typeof rawMdx === "string" ? rawMdx : "");

    return {
      props: {
        doc: sanitizeData(doc),
        source,
        canonicalPath: href,
      },
      revalidate: 1800,
    };
  } catch (error) {
    console.error("Error in getStaticProps for /content/[...slug]:", error);
    return { notFound: true };
  }
};

export default ContentSlugPage;