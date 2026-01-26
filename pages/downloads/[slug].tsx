/* pages/downloads/[slug].tsx — INSTITUTIONAL DOWNLOAD DETAIL (COMPILED API MODE) */
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

// Server-side imports
import { getAllContentlayerDocs } from "@/lib/content/real";
import { sanitizeData } from "@/lib/content/shared";

import dynamic from 'next/dynamic';

const MDXRemote = dynamic(
  () => import('next-mdx-remote').then((mod) => mod.MDXRemote),
  { ssr: false }
);

// In your component
export default function Page({ source, data }) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <Layout>
      {/* ... */}
      {source && isClient ? (
        <MDXRemote {...source} components={mdxComponents} />
      ) : (
        <div dangerouslySetInnerHTML={{ __html: source?.compiledSource || '' }} />
      )}
      {/* ... */}
    </Layout>
  );
}

// In getStaticProps
export const getStaticProps: GetStaticProps = async ({ params }) => {
  try {
    // ... your data fetching logic ...
    
    let source: any = { compiledSource: '' };
    if (rawMdxContent) {
      try {
        source = await prepareMDX(rawMdxContent);
      } catch (error) {
        console.error('MDX error:', error);
      }
    }
    
    return {
      props: {
        data: yourData,
        source: JSON.parse(JSON.stringify(source)), // 🔥 This is critical
      },
    };
  } catch (error) {
    return { notFound: true };
  }
};

type Tier = "public" | "inner-circle" | "private";

type Props = {
  download: {
    title: string;
    excerpt: string | null;
    description: string | null;
    slug: string;
    accessLevel: Tier;
    fileUrl: string | null;
    date: string | null;
    coverImage: string | null;
  };
  locked: boolean;
  initialSource: MDXRemoteSerializeResult | null;
};

type ApiOk = {
  ok: true;
  tier: Tier;
  requiredTier: Tier;
  source: MDXRemoteSerializeResult;
};

type ApiFail = {
  ok: false;
  reason: string;
};

// Server-side helper functions
function getServerAllDownloads(): any[] {
  const allDocs = getAllContentlayerDocs();
  return allDocs.filter(
    (doc: any) => doc.type === "Download" || doc._raw?.sourceFileDir === "downloads"
  );
}

function getServerDownloadBySlug(slug: string): any | null {
  const normalized = slug.replace(/^\/+|\/+$/g, "");
  const downloads = getServerAllDownloads();
  
  for (const doc of downloads) {
    const docSlug = doc.slug || "";
    const docHref = doc.href || "";
    const flattenedPath = doc._raw?.flattenedPath || "";
    
    const compareSlug = (s: string) => s.replace(/^\/+|\/+$/g, "");
    
    if (
      compareSlug(docSlug) === normalized ||
      compareSlug(docHref.replace(/^\//, "")) === normalized ||
      compareSlug(flattenedPath) === normalized
    ) {
      return doc;
    }
  }
  
  return null;
}

function stripDownloadsPrefix(input: string): string {
  return normalizeSlug(input).replace(/^downloads\//, "");
}

function normalizeSlug(slug: string): string {
  return slug.replace(/^\/+|\/+$/g, "").trim();
}

function isDraftContent(doc: any): boolean {
  return doc?.draft === true;
}

function asTier(v: unknown): Tier {
  const str = String(v || "").toLowerCase().trim();
  if (str === "private" || str === "restricted") return "private";
  if (str === "inner-circle" || str === "members" || str === "member") return "inner-circle";
  return "public";
}

export const getStaticPaths: GetStaticPaths = async () => {
  const downloads = getServerAllDownloads();

  const paths = (downloads || [])
    .filter((d: any) => d && !isDraftContent(d))
    .map((asset: any) => ({
      params: { slug: stripDownloadsPrefix(String(asset.slug || asset._raw?.flattenedPath || "")) },
    }))
    .filter((p) => p.params.slug);

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const raw = typeof params?.slug === "string" ? params.slug : "";
  const slug = stripDownloadsPrefix(raw);

  if (!slug) return { notFound: true };

  const doc: any = getServerDownloadBySlug(slug);
  if (!doc || isDraftContent(doc)) return { notFound: true };

  const accessLevel = asTier(doc.accessLevel || "inner-circle");
  const locked = accessLevel !== "public";

  // Only pre-serialize for public downloads (so no gated MDX lands in HTML)
  let initialSource: MDXRemoteSerializeResult | null = null;
  if (!locked) {
    const rawMdx = String(doc?.body?.raw ?? doc?.body ?? doc?.content ?? "");
    initialSource = await serialize(rawMdx, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
      },
    });
  }

  return {
    props: {
      download: sanitizeData({
        title: doc.title || "Untitled Download",
        excerpt: doc.excerpt ?? null,
        description: doc.description ?? null,
        slug: normalizeSlug(doc.slug || slug),
        accessLevel,
        fileUrl: doc.fileUrl || doc.downloadUrl || null,
        date: doc.date ? String(doc.date) : null,
        coverImage: doc.coverImage || null,
      }),
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
  const [errMsg, setErrMsg] = React.useState<string | null>(null);

  /**
   * Fetch compiled MDXRemote payload from /api/downloads/${slug}.
   * Client NEVER serializes/compiles gated content.
   */
  async function loadLockedContent(): Promise<boolean> {
    setErrMsg(null);
    setLoading(true);
    try {
      const slug = normalizeSlug(download.slug);
      const res = await fetch(`/api/downloads/${encodeURIComponent(slug)}`, {
        method: "GET",
        headers: { "Accept": "application/json" },
      });

      const json = (await res.json()) as ApiOk | ApiFail;

      if (!res.ok || !json || (json as ApiFail).ok === false) {
        setErrMsg((json as ApiFail)?.reason || "Access denied");
        return false;
      }

      const ok = json as ApiOk;
      if (!ok.source?.compiledSource) {
        setErrMsg("Invalid payload");
        return false;
      }

      setSource(ok.source);
      return true;
    } catch (e) {
      setErrMsg("Failed to unlock content");
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
        <meta name="robots" content={locked ? "noindex, nofollow" : "index, follow"} />
      </Head>

      <div className="mx-auto max-w-4xl px-4 py-16">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-white transition-colors"
          type="button"
        >
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

        {/* Gate only if locked AND no source yet */}
        {locked && !source && (
          <div className="mt-12">
            <AccessGate
              title={download.title}
              message={`This strategic asset requires ${download.accessLevel.replace("-", " ")} access.`}
              requiredTier={download.accessLevel}
              onUnlocked={loadLockedContent}
              onGoToJoin={() => router.push("/inner-circle")}
            />
          </div>
        )}

        {loading && (
          <div className="mt-12 flex items-center gap-3 text-gray-400">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Verifying credentials & decrypting manuscript...
          </div>
        )}

        {errMsg && (
          <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errMsg}
          </div>
        )}

        {source && (
          <article className="prose prose-invert mt-12 max-w-none animate-in fade-in slide-in-from-bottom-4 duration-700">
            <MDXRemote {...source} components={mdxComponents} />
          </article>
        )}

        {/* Optional: show file link if public + you want it visible */}
        {download.fileUrl && download.accessLevel === "public" && (
          <div className="mt-12">
            <a
              href={download.fileUrl}
              className="inline-flex items-center justify-center rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
            >
              Download file
            </a>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DownloadSlugPage;