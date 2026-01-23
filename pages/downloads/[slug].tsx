/* pages/downloads/[slug].tsx - RECONCILED INSTITUTIONAL PAGE */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import AccessGate from "@/components/AccessGate";
import { 
  getServerDownloadBySlug, 
  getServerAllDownloads, 
  getContentlayerData,
  normalizeSlug,
  isDraftContent 
} from "@/lib/contentlayer-compat";

type Props = {
  download: {
    title: string;
    excerpt: string | null;
    description: string | null;
    slug: string;
    accessLevel: "public" | "inner-circle" | "private";
    fileUrl: string | null;
    date: string | null;
    coverImage: string | null;
  };
  locked: boolean;
  initialSource: MDXRemoteSerializeResult | null;
};

export const getStaticPaths: GetStaticPaths = async () => {
  await getContentlayerData();
  const downloads = await getServerAllDownloads();
  
  const paths = downloads
    .filter(d => !isDraftContent(d))
    .map((asset) => ({
      params: { slug: normalizeSlug(asset.slug) },
    }));

  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  const doc = await getServerDownloadBySlug(slug);
  
  if (!doc || isDraftContent(doc)) return { notFound: true };

  // Institutional Tier Mapping
  const accessLevel = (doc.accessLevel || "inner-circle") as any;
  const locked = accessLevel !== "public";

  let initialSource: MDXRemoteSerializeResult | null = null;
  
  // Only pre-serialize if the content is public
  if (!locked) {
    const raw = doc.body?.raw || doc.body || "";
    initialSource = await serialize(raw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
      },
    });
  }

  return {
    props: {
      download: {
        title: doc.title || "Untitled Download",
        excerpt: doc.excerpt || null,
        description: doc.description || null,
        slug: normalizeSlug(doc.slug),
        accessLevel,
        fileUrl: doc.fileUrl || doc.downloadUrl || null,
        date: doc.date ? String(doc.date) : null,
        coverImage: doc.coverImage || null,
      },
      locked,
      initialSource,
    },
    revalidate: 1800,
  };
};

const DownloadSlugPage: NextPage<Props> = ({ download, locked, initialSource }) => {
  const router = useRouter();
  const [source, setSource] = React.useState<MDXRemoteSerializeResult | null>(initialSource);
  const [loading, setLoading] = React.useState(false);

  /**
   * Fetches the protected MDX string from the API and serializes it on the client.
   * This ensures raw MDX is never exposed in the static HTML for gated items.
   */
  async function loadLockedContent() {
    setLoading(true);
    try {
      const res = await fetch(`/api/downloads/mdx?slug=${encodeURIComponent(download.slug)}`);
      const json = await res.json();
      
      if (!res.ok || !json?.ok || !json?.mdx) return false;

      // Note: We use the client-side 'serialize' logic if json.source isn't pre-built
      const mdxSource = await serialize(json.mdx, {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
        },
      });

      setSource(mdxSource);
      return true;
    } catch (err) {
      console.error("Failed to unlock content", err);
      return false;
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title={download.title} description={download.description || download.excerpt || undefined}>
      <Head>
        <meta property="og:title" content={download.title} />
        <meta property="og:description" content={download.description || download.excerpt || ""} />
        {download.coverImage && <meta property="og:image" content={download.coverImage} />}
      </Head>

      <div className="mx-auto max-w-4xl px-4 py-16">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Back to Vault
        </button>

        <header className="mt-6 border-b border-white/10 pb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">{download.title}</h1>
          {(download.description || download.excerpt) && (
            <p className="mt-4 text-lg text-gray-300 leading-relaxed">
              {download.description || download.excerpt}
            </p>
          )}
        </header>

        {locked && !source && (
          <div className="mt-12">
            <AccessGate
              title={download.title}
              message={`This strategic asset requires ${download.accessLevel.replace('-', ' ')} access.`}
              requiredTier={download.accessLevel}
              onUnlocked={loadLockedContent}
              onGoToJoin={() => router.push("/inner-circle")}
            />
          </div>
        )}

        {loading && (
          <div className="mt-12 flex items-center gap-3 text-gray-400">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Decrypting manuscript...
          </div>
        )}

        {source && (
          <article className="prose prose-invert mt-12 max-w-none animate-in fade-in slide-in-from-bottom-4 duration-700">
            <MDXRemote {...source} components={mdxComponents} />
          </article>
        )}
      </div>
    </Layout>
  );
};

export default DownloadSlugPage;