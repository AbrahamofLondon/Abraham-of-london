// pages/resources/[...slug].tsx — BUILD-PROOF (Pages Router, Harrods/McKinsey Grade)
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import AccessGate from "@/components/AccessGate";
import { createSeededSafeMdxComponents } from "@/lib/mdx/safe-components";
import { useClientRouter, useClientQuery, useClientIsReady } from "@/lib/router/useClientRouter";

import {
  getAllCombinedDocs,
  getDocBySlug,
  normalizeSlug,
  isDraftContent,
  sanitizeData,
} from "@/lib/content/server";

import { ArrowLeft, Lock, Shield, ChevronRight, Calendar, User, Tag } from "lucide-react";

type AccessLevel = "public" | "inner-circle" | "private";

type ResourceMeta = {
  title: string;
  excerpt: string | null;
  description: string | null;
  slugPath: string;
  accessLevel: AccessLevel;
  date: string | null;
  tags: string[];
  author: string | null;
  coverImage: string | null;
};

type Props = {
  resource: ResourceMeta;
  locked: boolean;
  initialSource: MDXRemoteSerializeResult | null;
  mdxRaw: string;
};

type ApiOk = {
  ok: true;
  tier: AccessLevel;
  requiredTier: AccessLevel;
  source: MDXRemoteSerializeResult;
  mdxRaw: string;
};

type ApiFail = {
  ok: false;
  reason: string;
};

function toAccessLevel(v: unknown): AccessLevel {
  const n = String(v || "").toLowerCase().trim();
  if (n === "private" || n === "restricted") return "private";
  if (
    n === "inner-circle" ||
    n === "inner circle" ||
    n === "member" ||
    n === "members" ||
    n === "basic" ||
    n === "premium" ||
    n === "enterprise"
  ) {
    return "inner-circle";
  }
  return "public";
}

function isResourceDoc(d: any): boolean {
  const kind = String(d?.kind || d?.type || "").toLowerCase();
  if (kind === "resource") return true;

  const dir = String(d?._raw?.sourceFileDir || "").toLowerCase();
  const flat = String(d?._raw?.flattenedPath || "").toLowerCase();
  return dir.includes("resources") || flat.startsWith("resources/");
}

function stripMdxExt(s: string): string {
  return String(s || "").replace(/\.(md|mdx)$/, "");
}

function stripResourcesPrefix(input: string): string {
  return normalizeSlug(input).replace(/^resources\//, "");
}

function resourceSlugFromDoc(d: any): string {
  const raw =
    normalizeSlug(String(d?.slug || "")) ||
    normalizeSlug(String(d?._raw?.flattenedPath || "")) ||
    normalizeSlug(String(d?.href || "").replace(/^\/resources\//, ""));

  const noExt = stripMdxExt(raw);
  return stripResourcesPrefix(noExt);
}

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

// Prevent conflicts with real routes under /resources
const RESERVED_RESOURCE_ROUTES = new Set<string>([
  "strategic-frameworks",
]);

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const docs = getAllCombinedDocs();
    const resources = docs.filter(isResourceDoc).filter((d: any) => !isDraftContent(d));

    const slugPaths = resources
      .map(resourceSlugFromDoc)
      .filter(Boolean)
      .map((p) => normalizeSlug(p));

    const unique = Array.from(new Set(slugPaths)).filter((p) => {
      const head = p.split("/")[0] || "";
      return head && !RESERVED_RESOURCE_ROUTES.has(head);
    });

    return {
      paths: unique.map((slugPath) => ({
        params: { slug: slugPath.split("/").filter(Boolean) },
      })),
      fallback: "blocking",
    };
  } catch (e) {
    console.error("Error generating static paths:", e);
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const slugParam = ctx.params?.slug;

  const slugPath =
    typeof slugParam === "string"
      ? stripResourcesPrefix(slugParam)
      : Array.isArray(slugParam)
      ? stripResourcesPrefix(slugParam.join("/"))
      : "";

  if (!slugPath) return { notFound: true };

  const head = normalizeSlug(slugPath).split("/")[0] || "";
  if (RESERVED_RESOURCE_ROUTES.has(head)) return { notFound: true };

  const keyA = `resources/${slugPath}`;
  const keyB = slugPath;

  const doc = getDocBySlug(keyA) || getDocBySlug(keyB);
  if (!doc || !isResourceDoc(doc) || isDraftContent(doc)) return { notFound: true };

  const accessLevel = toAccessLevel((doc as any).accessLevel ?? (doc as any).tier);
  const locked = accessLevel !== "public";

  const mdxRaw = getRawBody(doc);

  let initialSource: MDXRemoteSerializeResult | null = null;
  if (!locked) {
    initialSource = await serialize(mdxRaw || " ", {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    });
  }

  const resource: ResourceMeta = {
    title: (doc as any).title || "Untitled Resource",
    excerpt: (doc as any).excerpt || null,
    description: (doc as any).description || null,
    slugPath,
    accessLevel,
    date: (doc as any).date || null,
    tags: Array.isArray((doc as any).tags) ? (doc as any).tags : [],
    author: (doc as any).author || null,
    coverImage: (doc as any).coverImage || null,
  };

  return {
    props: {
      resource: sanitizeData(resource),
      locked,
      initialSource,
      mdxRaw,
    },
    revalidate: 3600,
  };
};

const ResourceSlugPage: NextPage<Props> = ({ resource, locked, initialSource, mdxRaw }) => {
  // ✅ Router-safe hooks
  const router = useClientRouter();
  const query = useClientQuery();
  const isReady = useClientIsReady();
  
  const [source, setSource] = React.useState<MDXRemoteSerializeResult | null>(initialSource);
  const [loading, setLoading] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const safeComponents = React.useMemo(
    () =>
      createSeededSafeMdxComponents(mdxComponents, mdxRaw, {
        warnOnFallback: process.env.NODE_ENV === "development",
      }),
    [mdxRaw]
  );

  async function loadLockedContent(): Promise<boolean> {
    setErrMsg(null);
    setLoading(true);

    try {
      const slug = stripResourcesPrefix(resource.slugPath);

      const res = await fetch(`/api/resources/${encodeURIComponent(slug)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const json = (await res.json()) as ApiOk | ApiFail;

      if (!res.ok || !json || (json as any).ok === false) {
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
    } catch {
      setErrMsg("Failed to unlock content");
      return false;
    } finally {
      setLoading(false);
    }
  }

  const handleBackToResources = () => {
    if (router) router.push("/resources");
  };

  const handleGoToJoin = () => {
    if (router) router.push("/inner-circle");
  };

  const requiredTier: AccessLevel = resource.accessLevel === "private" ? "private" : "inner-circle";

  // ✅ Early return during SSR/prerender
  if (!router || !mounted) {
    return (
      <Layout title={resource.title}>
        <div className="min-h-screen bg-black" />
      </Layout>
    );
  }

  return (
    <Layout title={resource.title} description={resource.description || resource.excerpt || undefined}>
      <Head>
        <meta property="og:title" content={resource.title} />
        <meta property="og:description" content={resource.description || resource.excerpt || ""} />
        {resource.coverImage ? <meta property="og:image" content={resource.coverImage} /> : null}
        <meta name="robots" content={locked ? "noindex, nofollow" : "index, follow"} />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 text-white">
        {/* Navigation */}
        <div className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="mx-auto max-w-5xl px-6 py-4">
            <button
              onClick={handleBackToResources}
              className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors group text-sm"
              type="button"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
              <span className="font-mono text-[10px] uppercase tracking-widest">Back to Resources</span>
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-6 py-20">
          {/* Header */}
          <header className="mb-16">
            <div className="flex items-center gap-4 text-amber-500 font-mono text-[10px] uppercase tracking-[0.3em] mb-6">
              <Shield size={14} />
              <span>{resource.accessLevel} Clearance</span>
              <span className="w-12 h-px bg-amber-500/30" />
              {resource.date && <span className="text-white/30">{new Date(resource.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>}
            </div>

            <h1 className="font-serif text-5xl md:text-7xl font-bold text-white mb-8 leading-tight tracking-tight">
              {resource.title}
            </h1>

            {(resource.description || resource.excerpt) && (
              <p className="text-xl text-white/50 leading-relaxed max-w-3xl">
                {resource.description || resource.excerpt}
              </p>
            )}

            {/* Metadata bar */}
            <div className="mt-12 flex flex-wrap items-center gap-8 text-sm border-t border-white/5 pt-8">
              {resource.author && (
                <div className="flex items-center gap-2 text-white/30">
                  <User size={14} />
                  <span className="font-mono text-[10px] uppercase tracking-wider">{resource.author}</span>
                </div>
              )}
              {resource.tags.length > 0 && (
                <div className="flex items-center gap-2 text-white/30">
                  <Tag size={14} />
                  <div className="flex gap-2">
                    {resource.tags.map(tag => (
                      <span key={tag} className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 bg-white/5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Content */}
          {locked && !source ? (
            <div className="mt-16 max-w-2xl">
              <AccessGate
                title={resource.title}
                message={resource.accessLevel === "private" 
                  ? "This institutional resource is restricted to executive clearance." 
                  : "This resource requires Inner Circle membership."}
                requiredTier={requiredTier}
                onUnlocked={() => void loadLockedContent()}
                onGoToJoin={handleGoToJoin}
              />
            </div>
          ) : null}

          {loading && (
            <div className="mt-16 flex items-center gap-3 text-amber-500">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-[10px] uppercase tracking-widest">Verifying credentials & decrypting resource…</span>
            </div>
          )}

          {errMsg && (
            <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-4 text-sm text-red-200">
              {errMsg}
            </div>
          )}

          {source && (
            <div className="mt-16 prose prose-invert prose-amber max-w-none">
              <MDXRemote {...source} components={safeComponents as any} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ResourceSlugPage;