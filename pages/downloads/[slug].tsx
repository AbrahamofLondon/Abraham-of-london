// pages/downloads/[slug].tsx — FINAL BUILD-PROOF (seed + proxy, Pages Router)
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

// ✅ STANDARDIZED: Use createSeededSafeMdxComponents for seed + proxy
import { createSeededSafeMdxComponents } from "@/lib/mdx/safe-components";
import mdxComponents from "@/components/mdx-components";

// ✅ Shared utilities
import { sanitizeData } from "@/lib/content/shared";

// ✅ Server-side doc source
import { getAllContentlayerDocs } from "@/lib/content/real";

// ==================== TYPES ====================

type Tier = "public" | "inner-circle" | "private";

type DownloadDTO = {
  title: string;
  excerpt: string | null;
  description: string | null;
  slug: string;
  accessLevel: Tier;
  fileUrl: string | null;
  date: string | null;
  coverImage: string | null;
};

type Props = {
  download: DownloadDTO;
  locked: boolean;
  initialSource: MDXRemoteSerializeResult | null;
  mdxRaw: string; // ✅ ADDED: Required for seeding
};

type ApiOk = {
  ok: true;
  tier: Tier;
  requiredTier: Tier;
  source: MDXRemoteSerializeResult;
  mdxRaw: string; // ✅ ADDED: For re-seeding on client if needed
};

type ApiFail = {
  ok: false;
  reason: string;
};

// ==================== SLUG / TIER HELPERS ====================

function normalizeSlug(input: string): string {
  return String(input || "").replace(/^\/+|\/+$/g, "").trim();
}

function stripDownloadsPrefix(input: string): string {
  return normalizeSlug(input).replace(/^downloads\//, "");
}

function isDraftContent(doc: any): boolean {
  if (!doc) return true;
  if (doc.draft === true) return true;
  if (doc.published === false) return true;
  const status = String(doc.status || "").toLowerCase();
  if (status === "draft" || status === "unpublished") return true;
  return false;
}

function asTier(v: unknown): Tier {
  const s = String(v || "").toLowerCase().trim();
  if (!s) return "inner-circle";
  if (s === "private" || s === "restricted" || s === "firm" || s === "internal") return "private";
  if (s.startsWith("inner-circle")) return "inner-circle";
  if (s === "premium" || s === "enterprise" || s === "architect" || s === "elite") return "inner-circle";
  if (s === "public" || s === "free") return "public";
  return "inner-circle";
}

function slugMatches(doc: any, normalized: string): boolean {
  const cmp = (x: any) => normalizeSlug(String(x || "")).replace(/^downloads\//, "");
  const direct = [
    doc?.slug,
    doc?.href?.replace(/^\//, ""),
    doc?._raw?.flattenedPath,
    doc?._raw?.sourceFileName?.replace(/\.mdx?$/i, ""),
  ].map(cmp);
  const aliases: string[] = Array.isArray(doc?.aliases) ? doc.aliases.map(cmp) : [];
  return [...direct, ...aliases].some((v) => v && v === normalized);
}

// ==================== SERVER HELPERS ====================

function getServerAllDownloads(): any[] {
  try {
    const allDocs = getAllContentlayerDocs();
    if (!Array.isArray(allDocs)) return [];
    
    return allDocs.filter((doc: any) => {
      if (!doc) return false;
      
      const type = String(doc.type || "").toLowerCase();
      if (type === "download") return true;
      
      const dir = String(doc._raw?.sourceFileDir || "").toLowerCase();
      if (dir.includes("downloads")) return true;
      
      const path = String(doc._raw?.flattenedPath || "").toLowerCase();
      return path.startsWith("downloads/");
    });
  } catch (error) {
    console.error("[getServerAllDownloads] Error:", error);
    return [];
  }
}

function getServerDownloadBySlug(slug: string): any | null {
  try {
    const normalized = stripDownloadsPrefix(slug);
    if (!normalized) return null;
    
    const downloads = getServerAllDownloads();
    for (const doc of downloads) {
      if (slugMatches(doc, normalized)) return doc;
    }
    return null;
  } catch (error) {
    console.error("[getServerDownloadBySlug] Error:", error);
    return null;
  }
}

// ==================== SAFE UTILITIES ====================

function safeString(value: any, defaultValue: string | null = null): string | null {
  if (value == null) return defaultValue;
  const str = String(value).trim();
  return str || defaultValue;
}

function safeArray<T>(value: any, defaultValue: T[] = []): T[] {
  return Array.isArray(value) ? value : defaultValue;
}

// Paranoid MDX extraction
function getRawBody(d: any): string {
  return (
    d?.body?.raw ||
    (typeof d?.bodyRaw === "string" ? d.bodyRaw : "") ||
    (typeof d?.content === "string" ? d.content : "") ||
    (typeof d?.body === "string" ? d.body : "") ||
    (typeof d?.mdx === "string" ? d.mdx : "") ||
    ""
  );
}

// ==================== PAGE ====================

const DownloadSlugPage: NextPage<Props> = ({ download, locked, initialSource, mdxRaw }) => {
  const router = useRouter();
  const [source, setSource] = React.useState<MDXRemoteSerializeResult | null>(initialSource);
  const [loading, setLoading] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState<string | null>(null);

  // ✅ SEED (enumerable) + PROXY (read-safe) => stops ResourcesCTA/BrandFrame/Rule/etc forever
  const safeComponents = React.useMemo(
    () =>
      createSeededSafeMdxComponents(mdxComponents, mdxRaw, {
        warnOnFallback: process.env.NODE_ENV === "development",
        seeded: {
          // Ensure DownloadCard is available in the component map
          DownloadCard: DownloadCard as React.ComponentType<any>,
        },
      }),
    [mdxRaw]
  );

  async function loadLockedContent(): Promise<boolean> {
    setErrMsg(null);
    setLoading(true);
    try {
      const slug = stripDownloadsPrefix(download.slug);
      if (!slug) {
        setErrMsg("Invalid download slug");
        return false;
      }

      const res = await fetch(`/api/downloads/${encodeURIComponent(slug)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        setErrMsg("Access denied");
        return false;
      }

      const json = await res.json() as ApiOk | ApiFail;
      
      if (!json || (json as ApiFail).ok === false) {
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
    } catch (error) {
      console.error("[loadLockedContent] Error:", error);
      setErrMsg("Failed to unlock content");
      return false;
    } finally {
      setLoading(false);
    }
  }

  if (router.isFallback) {
    return (
      <Layout title="Loading…">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-gray-400">Loading…</p>
        </div>
      </Layout>
    );
  }

  const description = safeString(download.description || download.excerpt, "");
  const safeTitle = safeString(download.title, "Download");

  return (
    <Layout title={safeTitle} description={description || undefined}>
      <Head>
        <title>{`${safeTitle} | Downloads | Abraham of London`}</title>
        <meta property="og:title" content={safeTitle} />
        <meta property="og:description" content={description} />
        {download.coverImage ? <meta property="og:image" content={download.coverImage} /> : null}
        <meta name="robots" content={locked ? "noindex, nofollow" : "index, follow"} />
        <link rel="canonical" href={`https://www.abrahamoflondon.org/downloads/${download.slug}`} />
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
          <h1 className="text-4xl font-bold text-white tracking-tight">{safeTitle}</h1>
          {description ? (
            <p className="mt-4 text-lg text-gray-300 leading-relaxed">{description}</p>
          ) : null}
          {download.date ? (
            <p className="mt-3 text-sm text-gray-500">
              {new Date(download.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          ) : null}
        </header>

        {locked && !source ? (
          <div className="mt-12">
            <AccessGate
              title={safeTitle}
              message={`This strategic asset requires ${download.accessLevel.replace("-", " ")} access.`}
              requiredTier={download.accessLevel}
              onUnlocked={loadLockedContent}
              onGoToJoin={() => router.push("/inner-circle")}
            />
          </div>
        ) : null}

        {loading ? (
          <div className="mt-12 flex items-center gap-3 text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            Verifying credentials & decrypting manuscript...
          </div>
        ) : null}

        {errMsg ? (
          <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errMsg}
          </div>
        ) : null}

        {source ? (
          <article className="prose prose-invert mt-12 max-w-none animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* ✅ SEED + PROXY: Guaranteed no missing component errors */}
            <MDXRemote {...source} components={safeComponents as any} />
          </article>
        ) : null}

        {download.fileUrl && download.accessLevel === "public" ? (
          <div className="mt-12 flex gap-4">
            <a
              href={download.fileUrl}
              download
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download File
            </a>
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

// ==================== STATIC PATHS ====================

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const downloads = getServerAllDownloads();
    const paths = downloads
      .filter((d: any) => d && !isDraftContent(d))
      .map((doc: any) => {
        const base = doc.slug || doc._raw?.flattenedPath || "";
        const slug = stripDownloadsPrefix(String(base));
        return slug ? { params: { slug } } : null;
      })
      .filter(Boolean) as Array<{ params: { slug: string } }>;

    console.log(`[downloads/getStaticPaths] Generated ${paths.length} paths`);
    return { paths, fallback: "blocking" };
  } catch (error) {
    console.error("[downloads/getStaticPaths] Error:", error);
    return { paths: [], fallback: "blocking" };
  }
};

// ==================== STATIC PROPS ====================

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const raw = typeof params?.slug === "string" ? params.slug : "";
    const slug = stripDownloadsPrefix(raw);

    if (!slug) {
      console.warn("[downloads/getStaticProps] Empty slug");
      return { notFound: true };
    }

    const doc: any = getServerDownloadBySlug(slug);
    if (!doc || isDraftContent(doc)) {
      console.warn(`[downloads/getStaticProps] No download found for slug: ${slug}`);
      return { notFound: true };
    }

    const accessLevel = asTier(doc.accessLevel || doc.tier || "inner-circle");
    const locked = accessLevel !== "public";

    // ✅ EXTRACT MDX RAW CONTENT FOR SEEDING
    const mdxRaw = getRawBody(doc);
    
    let initialSource: MDXRemoteSerializeResult | null = null;
    if (!locked) {
      // ✅ USE DIRECT SERIALIZE
      if (mdxRaw.trim()) {
        try {
          initialSource = await serialize(mdxRaw, {
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeSlug],
            },
          });
        } catch (mdxError) {
          console.error(`[downloads/getStaticProps] MDX error for ${slug}:`, mdxError);
          // Continue without MDX content
        }
      }
    }

    const fileUrl =
      doc.fileUrl ||
      doc.downloadUrl ||
      doc.file ||
      (typeof doc.href === "string" && doc.href.endsWith(".pdf") ? doc.href : null) ||
      null;

    const dto: DownloadDTO = {
      title: safeString(doc.title, "Untitled Download") || "Untitled Download",
      excerpt: safeString(doc.excerpt),
      description: safeString(doc.description),
      slug: normalizeSlug(doc.slug || slug),
      accessLevel,
      fileUrl: safeString(fileUrl),
      date: safeString(doc.date),
      coverImage: safeString(doc.coverImage),
    };

    return {
      props: sanitizeData({
        download: dto,
        locked,
        initialSource,
        mdxRaw, // ✅ PASS MDX RAW FOR SEEDING
      }),
      revalidate: 1800,
    };
  } catch (error) {
    console.error(`[downloads/getStaticProps] Fatal error for slug ${String(params?.slug)}:`, error);
    
    // Provide safe fallback props
    return {
      props: {
        download: {
          title: "Download",
          excerpt: null,
          description: null,
          slug: "error",
          accessLevel: "public" as Tier,
          fileUrl: null,
          date: null,
          coverImage: null,
        },
        locked: true,
        initialSource: null,
        mdxRaw: "", // ✅ Even on error, pass empty mdxRaw
      },
    };
  }
};

export default DownloadSlugPage;