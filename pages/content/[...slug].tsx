// pages/content/[...slug].tsx — HARDENED (Netlify-Resilient Vault Proxy)
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import Head from "next/head";
import { useRouter } from "next/router";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { Loader2 } from "lucide-react";

import ContentlayerDocPage from "@/components/ContentlayerDocPage";

// ✅ Institutional Server-side helpers
import {
  getContentlayerData,
  getAllContentlayerDocs,
  getDocBySlug,
  isDraftContent,
} from "@/lib/content/server";

import {
  getDocHref,
  normalizeSlug,
  toUiDoc,
} from "@/lib/content/shared";

import { sanitizeData } from "@/lib/server/md-utils";

type UiDoc = ReturnType<typeof toUiDoc>;

interface Props {
  doc: UiDoc;
  source: MDXRemoteSerializeResult;
  canonicalPath: string;
  mdxRaw: string; 
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

function getRawBody(d: any): string {
  return d?.body?.raw || d?.bodyRaw || d?.content || d?.body || d?.mdx || "";
}

const ContentSlugPage: NextPage<Props> = ({ doc, source, canonicalPath, mdxRaw }) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="flex items-center gap-3 text-amber-500 animate-pulse">
          <Loader2 className="animate-spin" size={20} />
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] italic">
            Synchronising Registry Vault...
          </span>
        </div>
      </div>
    );
  }

  if (!doc) return null;

  const canonicalUrl = `${SITE_URL}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`;
  const desc = doc.description || doc.excerpt || "Institutional intelligence asset // Abraham of London.";

  return (
    <>
      <Head>
        <title>{`${doc.title.toUpperCase()} // REGISTRY`}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Institutional OpenGraph */}
        <meta property="og:title" content={`${doc.title} | Abraham of London`} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        {doc.coverImage && <meta property="og:image" content={doc.coverImage} />}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        {doc.date && <meta property="article:published_time" content={doc.date} />}
      </Head>

      <ContentlayerDocPage
        doc={doc}
        source={source}
        canonicalPath={canonicalPath}
        backHref="/content"
        label="Strategic Archive"
        mdxRaw={mdxRaw} 
      />
    </>
  );
};

/* -----------------------------------------------------------------------------
  PATH GENERATION: EXHAUSTIVE CATCH-ALL
----------------------------------------------------------------------------- */
export const getStaticPaths: GetStaticPaths = async () => {
  try {
    getContentlayerData(); 
    const docs = getAllContentlayerDocs();

    const paths = docs
      .filter((d) => {
        if (!d || isDraftContent(d)) return false;
        const href = getDocHref(d);
        // Only route docs that belong to the /content/ hierarchy
        return Boolean(href) && href.startsWith("/content/");
      })
      .map((doc) => {
        const href = getDocHref(doc);
        const rest = normalizeSlug(href!.replace(/^\/content\//, ""));
        const parts = rest.split("/").filter(Boolean);
        return parts.length > 0 ? { params: { slug: parts } } : null;
      })
      .filter(Boolean) as { params: { slug: string[] } }[];

    return { paths, fallback: "blocking" };
  } catch (error) {
    console.error("[VAULT_PATH_ERROR]", error);
    return { paths: [], fallback: "blocking" };
  }
};

/* -----------------------------------------------------------------------------
  DATA FETCHING: SERIALIZED RESOLUTION
----------------------------------------------------------------------------- */
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const slugParts = params?.slug;
    if (!slugParts) return { notFound: true };

    const joinedSlug = Array.isArray(slugParts) ? slugParts.join("/") : slugParts;
    const normalized = normalizeSlug(joinedSlug);
    
    // Attempt multi-directory resolution
    const rawDoc = getDocBySlug(`content/${normalized}`);
    
    if (!rawDoc || isDraftContent(rawDoc)) {
      return { notFound: true };
    }

    const href = getDocHref(rawDoc);
    const doc = toUiDoc(rawDoc);
    const mdxRaw = getRawBody(rawDoc);
    
    // Server-side serialization (Hardened with GFM for tables/lists)
    const source = await serialize(mdxRaw || " ", {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    });

    return {
      props: {
        doc: sanitizeData(doc),
        source,
        canonicalPath: href || `/content/${normalized}`,
        mdxRaw,
      },
      revalidate: 1800, // 30-minute archival sync
    };
  } catch (error) {
    console.error("[VAULT_PROPS_ERROR]", error);
    return { notFound: true };
  }
};

export default ContentSlugPage;