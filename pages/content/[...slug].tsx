// pages/content/[...slug].tsx — FINAL BUILD-PROOF (seed + proxy, Pages Router)
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import Head from "next/head";
import { useRouter } from "next/router";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import ContentlayerDocPage from "@/components/ContentlayerDocPage";

// ✅ Server-side helpers
import {
  getContentlayerData,
  getAllContentlayerDocs,
  getDocBySlug,
  isDraftContent,
} from '@/lib/contentlayer-helper';

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
  mdxRaw: string; // ✅ Required for seeding
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

function getRawBody(d: any): string {
  return d?.body?.raw || d?.bodyRaw || d?.content || d?.body || d?.mdx || "";
}

const ContentSlugPage: NextPage<Props> = ({ doc, source, canonicalPath, mdxRaw }) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gold/20 border-t-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-serif tracking-widest uppercase text-xs">Accessing Vault...</p>
        </div>
      </div>
    );
  }

  if (!doc) return null; // getStaticProps handles 404

  const canonicalUrl = `${SITE_URL}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`;
  const desc = doc.description || doc.excerpt || "Intelligence asset from the Abraham of London vault.";

  return (
    <>
      <Head>
        <title>{`${doc.title} | Abraham of London`}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonicalUrl} />
        
        <meta property="og:title" content={doc.title} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        {doc.coverImage && <meta property="og:image" content={doc.coverImage} />}

        <meta name="twitter:card" content="summary_large_image" />
        {doc.date && <meta property="article:published_time" content={doc.date} />}
      </Head>

      {/* ✅ ContentlayerDocPage receives mdxRaw to initialize createSeededSafeMdxComponents */}
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

// ==================== PATH GENERATION ====================

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    getContentlayerData(); // Ensure data is primed
    const docs = getAllContentlayerDocs();

    const paths = docs
      .filter((d) => {
        if (!d || isDraftContent(d)) return false;
        const href = getDocHref(d);
        // This catch-all handles anything routed through /content/
        return Boolean(href) && href.startsWith("/content/");
      })
      .map((doc) => {
        const href = getDocHref(doc);
        const rest = normalizeSlug(href!.replace(/^\/content\//, ""));
        const parts = rest.split("/").filter(Boolean);
        return parts.length > 0 ? { params: { slug: parts } } : null;
      })
      .filter(Boolean) as { params: { slug: string[] } }[];

    console.log(`📄 Catch-all Vault: Generated ${paths.length} nested paths`);
    return { paths, fallback: "blocking" };
  } catch (error) {
    console.error("Static Path Error:", error);
    return { paths: [], fallback: "blocking" };
  }
};

// ==================== DATA FETCHING ====================

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const slugParts = params?.slug;
    if (!slugParts) return { notFound: true };

    const joinedSlug = Array.isArray(slugParts) ? slugParts.join("/") : slugParts;
    const normalized = normalizeSlug(joinedSlug);
    
    // Attempt to find the doc across all sub-directories (canon, strategy, etc)
    const rawDoc = getDocBySlug(`content/${normalized}`);
    
    if (!rawDoc || isDraftContent(rawDoc)) {
      console.warn(`[Vault] Missing or Draft: content/${normalized}`);
      return { notFound: true };
    }

    const href = getDocHref(rawDoc);
    const doc = toUiDoc(rawDoc);
    const mdxRaw = getRawBody(rawDoc);
    
    // Direct build-time serialization
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
      revalidate: 1800,
    };
  } catch (error) {
    console.error("Static Props Error:", error);
    return { notFound: true };
  }
};

export default ContentSlugPage;