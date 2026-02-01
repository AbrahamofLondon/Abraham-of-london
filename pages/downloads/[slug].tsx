// pages/downloads/[slug].tsx — HARDENED PRODUCTION BUILD
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import Layout from "@/components/Layout";
import DownloadCard from "@/components/DownloadCard";
import AccessGate from "@/components/AccessGate";

// Utility & Content logic
import { createSeededSafeMdxComponents } from "@/lib/mdx/safe-components";
import mdxComponents from "@/components/mdx-components";
import { sanitizeData } from "@/lib/content/shared";
import { getAllContentlayerDocs } from "@/lib/content/real";

// ==================== TYPES (Immutable Invariants) ====================

type Tier = "public" | "inner-circle" | "private";

interface DownloadDTO {
  title: string;
  excerpt: string | null;
  description: string | null;
  slug: string;
  accessLevel: Tier;
  fileUrl: string | null;
  date: string | null;
  coverImage: string | null;
  category: string | null;
  size: string | null;
  pageCount: number | null;
}

interface Props {
  download: DownloadDTO;
  locked: boolean;
  initialSource: MDXRemoteSerializeResult | null;
  mdxRaw: string;
}

// ==================== DEFENSIVE HELPERS ====================

const normalizeSlug = (s: string) => String(s || "").replace(/^\/+|\/+$/g, "").trim();
const stripPrefix = (s: string) => normalizeSlug(s).replace(/^downloads\//, "");

function getRawBody(doc: any): string {
  if (!doc) return "";
  return doc.body?.raw || doc.content || doc.body || "";
}

// ==================== PAGE COMPONENT ====================

const DownloadSlugPage: NextPage<Props> = ({ download, locked, initialSource, mdxRaw }) => {
  const router = useRouter();
  const [source, setSource] = React.useState<MDXRemoteSerializeResult | null>(initialSource);
  const [loading, setLoading] = React.useState(false);

  // Safe components with error boundaries internally
  const safeComponents = React.useMemo(() => 
    createSeededSafeMdxComponents(mdxComponents, mdxRaw, {
      seeded: { DownloadCard: DownloadCard as React.ComponentType<any> }
    }), [mdxRaw]
  );

  async function handleUnlock() {
    setLoading(true);
    try {
      const res = await fetch(`/api/downloads/${encodeURIComponent(stripPrefix(download.slug))}`);
      const data = await res.json();
      if (data.ok) setSource(data.source);
      return data.ok;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }

  if (router.isFallback) return <Layout title="Loading...">...</Layout>;

  return (
    <Layout title={download.title} description={download.excerpt || ""}>
      <Head>
        <meta name="robots" content={locked ? "noindex" : "index"} />
        <link rel="canonical" href={`https://www.abrahamoflondon.org/downloads/${download.slug}`} />
      </Head>

      <div className="mx-auto max-w-4xl px-4 py-16">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gold mb-8 transition-colors">
          ← Back to Intelligence Vault
        </button>

        <header className="border-b border-white/5 pb-10">
          <div className="flex items-center gap-4 mb-4 text-[10px] font-bold uppercase tracking-[0.2em]">
            {download.category && <span className="text-gold bg-gold/10 px-2 py-1 rounded">{download.category}</span>}
            {download.pageCount && <span className="text-gray-400">{download.pageCount} Pages</span>}
            {download.size && <span className="text-gray-600">{download.size}</span>}
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-cream leading-tight">
            {download.title}
          </h1>
        </header>

        <main className="mt-12">
          {locked && !source ? (
            <AccessGate 
              requiredTier={download.accessLevel} 
              onUnlocked={handleUnlock}
              onGoToJoin={() => router.push("/inner-circle")}
            />
          ) : source && (
            <article className="prose prose-invert max-w-none">
              <MDXRemote {...source} components={safeComponents as any} />
            </article>
          )}
        </main>
      </div>
    </Layout>
  );
};

// ==================== BUILD LOGIC (Zero-Risk) ====================

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getAllContentlayerDocs() || [];
  const paths = docs
    .filter((d: any) => d && !d.draft)
    .map((d: any) => ({ params: { slug: stripPrefix(d.slug || d._raw?.flattenedPath) } }))
    .filter(p => p.params.slug);

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const slug = stripPrefix(String(params?.slug || ""));
    const allDocs = getAllContentlayerDocs() || [];
    const doc = allDocs.find((d: any) => normalizeSlug(d.slug || d._raw?.flattenedPath).includes(slug));

    if (!doc || doc.draft) return { notFound: true };

    const mdxRaw = getRawBody(doc);
    const accessLevel = (doc.accessLevel || "inner-circle") as Tier;
    const locked = accessLevel !== "public";

    let initialSource = null;
    if (!locked && mdxRaw.trim()) {
      initialSource = await serialize(mdxRaw, {
        mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] }
      });
    }

    const dto: DownloadDTO = {
      title: String(doc.title || "Untitled Brief"),
      excerpt: doc.excerpt || null,
      description: doc.description || null,
      slug: slug,
      accessLevel,
      fileUrl: doc.fileUrl || doc.downloadUrl || null,
      date: doc.date || null,
      coverImage: doc.coverImage || null,
      category: doc.category || "General",
      size: doc.size || null,
      pageCount: doc.pageCount ? Number(doc.pageCount) : null,
    };

    return {
      props: sanitizeData({ download: dto, locked, initialSource, mdxRaw }),
      revalidate: 3600,
    };
  } catch (err) {
    console.error("Build Error on Slug:", params?.slug, err);
    return { notFound: true };
  }
};

export default DownloadSlugPage;