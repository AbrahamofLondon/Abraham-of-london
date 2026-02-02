// pages/downloads/[slug].tsx — HARDENED PRODUCTION BUILD (Bare Slug Strategy)
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

// ✅ Governance & Security
import { createSeededSafeMdxComponents } from "@/lib/mdx/safe-components";
import mdxComponents from "@/components/mdx-components";
import { sanitizeData } from "@/lib/content/shared";
// Note: Using getDownloads ensures we only query the correct collection
import { getDownloads } from "@/lib/content/server"; 

/* -----------------------------------------------------------------------------
  TYPES
----------------------------------------------------------------------------- */
type Tier = "public" | "inner-circle" | "private";

interface DownloadDTO {
  title: string;
  excerpt: string | null;
  description: string | null;
  slug: string;
  href: string;
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

/* -----------------------------------------------------------------------------
  DEFENSIVE HELPERS
----------------------------------------------------------------------------- */
const normalizeSlug = (s: string) => String(s || "").replace(/^\/+|\/+$/g, "").trim();
const stripPrefix = (s: string) => normalizeSlug(s).replace(/^downloads\//, "");

function getRawBody(doc: any): string {
  return doc?.body?.raw || doc?.content || doc?.body || "";
}

/* -----------------------------------------------------------------------------
  PAGE COMPONENT
----------------------------------------------------------------------------- */
const DownloadSlugPage: NextPage<Props> = ({ download, locked, initialSource, mdxRaw }) => {
  const router = useRouter();
  const [source, setSource] = React.useState<MDXRemoteSerializeResult | null>(initialSource);
  const [loading, setLoading] = React.useState(false);

  const safeComponents = React.useMemo(() => 
    createSeededSafeMdxComponents(mdxComponents, mdxRaw, {
      seeded: { DownloadCard: DownloadCard as React.ComponentType<any> }
    }), [mdxRaw]
  );

  const handleUnlock = async (): Promise<boolean> => {
    setLoading(true);
    try {
      // ✅ Using the stripped slug for the API call
      const res = await fetch(`/api/downloads/${encodeURIComponent(download.slug)}`);
      const data = await res.json();
      if (data.ok) {
        setSource(data.source);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  if (router.isFallback) return <Layout title="Loading Intelligence...">...</Layout>;

  return (
    <Layout title={download.title} description={download.excerpt || ""}>
      <Head>
        <meta name="robots" content={locked ? "noindex, nofollow" : "index, follow"} />
        <link rel="canonical" href={`https://www.abrahamoflondon.org${download.href}`} />
      </Head>

      <div className="mx-auto max-w-4xl px-6 py-16">
        <button 
          onClick={() => router.push('/downloads')} 
          className="text-xs uppercase tracking-widest text-gray-500 hover:text-gold mb-12 transition-colors flex items-center gap-2"
        >
          ← Return to Vault
        </button>

        <header className="border-b border-white/10 pb-12">
          <div className="flex items-center gap-4 mb-6 text-[10px] font-bold uppercase tracking-[0.2em]">
            {download.category && (
              <span className="text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
                {download.category}
              </span>
            )}
            {download.pageCount && <span className="text-gray-400">{download.pageCount} Pages</span>}
            {download.size && <span className="text-gray-500">{download.size}</span>}
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-cream leading-tight italic">
            {download.title}
          </h1>
        </header>

        <main className="mt-16">
          {locked && !source ? (
            <div className="py-12">
              <AccessGate 
                title={download.title}
                message="This tactical brief is restricted to the Inner Circle."
                requiredTier={download.accessLevel} 
                onUnlocked={handleUnlock}
                onGoToJoin={() => router.push("/inner-circle")}
              />
            </div>
          ) : (
            source && (
              <article className="prose prose-invert prose-gold max-w-none prose-p:text-gray-300 prose-p:leading-relaxed">
                <MDXRemote {...source} components={safeComponents as any} />
              </article>
            )
          )}
        </main>
      </div>
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
  BUILD LOGIC
----------------------------------------------------------------------------- */
export const getStaticPaths: GetStaticPaths = async () => {
  // ✅ Specifically using getDownloads to avoid mixed-content collisions
  const docs = getDownloads() || [];
  const paths = docs
    .filter((d: any) => !d.draft)
    .map((d: any) => {
      const bareSlug = stripPrefix(d.slug || d._raw?.flattenedPath || "");
      return { params: { slug: bareSlug } };
    })
    .filter(p => p.params.slug);

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const slug = stripPrefix(String(params?.slug || ""));
    const allDocuments = getDownloads() || [];
    
    // ✅ Cross-check bare slug against normalized content
    const doc = allDocuments.find((d: any) => {
      const dSlug = normalizeSlug(d.slug || d._raw?.flattenedPath || "");
      return dSlug.endsWith(slug);
    });

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
      href: `/downloads/${slug}`,
      accessLevel,
      fileUrl: doc.fileUrl || doc.downloadUrl || null,
      date: doc.date ? String(doc.date) : null,
      coverImage: doc.coverImage || null,
      category: doc.category || "General Intelligence",
      size: doc.size || null,
      pageCount: doc.pageCount ? Number(doc.pageCount) : null,
    };

    return {
      props: sanitizeData({ download: dto, locked, initialSource, mdxRaw }),
      revalidate: 3600,
    };
  } catch (err) {
    return { notFound: true };
  }
};

export default DownloadSlugPage;