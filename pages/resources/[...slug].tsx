// pages/resources/[...slug].tsx — BUILD-PROOF (Pages Router, Harrods/McKinsey Grade)
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";

import Layout from "@/components/Layout";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer"; // ✅ Use SafeMDXRenderer
import AccessGate from "@/components/AccessGate";
import { useClientRouter, useClientQuery, useClientIsReady } from "@/lib/router/useClientRouter";

import {
  getAllCombinedDocs,
  getDocBySlug,
  normalizeSlug,
  isDraftContent,
  sanitizeData,
} from "@/lib/content/server";
import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

import { ArrowLeft, Lock, Shield, Calendar, User, Tag } from "lucide-react";

type ResourceMeta = {
  title: string;
  excerpt: string | null;
  description: string | null;
  slugPath: string;
  accessLevel: AccessTier;
  date: string | null;
  tags: string[];
  author: string | null;
  coverImage: string | null;
};

type Props = {
  resource: ResourceMeta;
  locked: boolean;
  requiredTier: AccessTier;
  initialBodyCode: string | null; // ✅ Pre-compiled MDX code
};

type ApiOk = {
  ok: true;
  tier: AccessTier;
  requiredTier: AccessTier;
  bodyCode: string; // ✅ Compiled code, not serialized source
};

type ApiFail = {
  ok: false;
  reason: string;
};

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
  const normalized = normalizeSlug(input).replace(/^resources\//, "");
  // ✅ Prevent path traversal
  if (normalized.includes('..') || normalized.includes('\\') || normalized.includes('//')) {
    return '';
  }
  return normalized;
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

// ✅ FIXED: Prevent conflicts with real routes under /resources
// Add all dedicated framework routes here
const RESERVED_RESOURCE_ROUTES = new Set<string>([
  "strategic-frameworks",
  "surrender-framework",
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

  // ✅ Use normalizeRequired for content tiers
  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));
  const locked = requiredTier !== "public";

  // ✅ Only ship pre-compiled code for public content
  const initialBodyCode = !locked ? (doc.body?.code || doc.bodyCode || null) : null;

  const resource: ResourceMeta = {
    title: (doc as any).title || "Untitled Resource",
    excerpt: (doc as any).excerpt || null,
    description: (doc as any).description || null,
    slugPath,
    accessLevel: requiredTier,
    date: (doc as any).date || null,
    tags: Array.isArray((doc as any).tags) ? (doc as any).tags : [],
    author: (doc as any).author || null,
    coverImage: (doc as any).coverImage || null,
  };

  return {
    props: {
      resource: sanitizeData(resource),
      locked,
      requiredTier,
      initialBodyCode,
    },
    revalidate: 3600,
  };
};

const ResourceSlugPage: NextPage<Props> = ({ 
  resource, 
  locked, 
  requiredTier, 
  initialBodyCode 
}) => {
  const router = useClientRouter();
  const query = useClientQuery();
  const isReady = useClientIsReady();
  const { data: session, status } = useSession();
  
  const [bodyCode, setBodyCode] = React.useState<string | null>(initialBodyCode);
  const [loading, setLoading] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Use correct normalizers
  const required = tiers.normalizeRequired(requiredTier);
  const user = tiers.normalizeUser(session?.user?.tier ?? "public");

  const needsAuth = required !== "public";
  const canAccess = tiers.hasAccess(user, required);

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
      if (!ok.bodyCode) {
        setErrMsg("Invalid payload");
        return false;
      }

      // ✅ Set state with compiled code - no re-serialization
      setBodyCode(ok.bodyCode);
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

  // ✅ SSR/build shell - no loading state
  if (!router || !mounted) {
    return (
      <Layout title={resource.title}>
        <div className="min-h-screen bg-black" />
      </Layout>
    );
  }

  // ✅ Only show loading for restricted content
  if (needsAuth && status === "loading") {
    return (
      <Layout title={resource.title}>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-amber-500 font-mono text-xs animate-pulse">Verifying clearance...</div>
        </div>
      </Layout>
    );
  }

  // ✅ Gate for unauthorized users
  if (needsAuth && (!session?.user || !canAccess)) {
    return (
      <Layout title={resource.title}>
        <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 text-white">
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
            <AccessGate
              title={resource.title}
              message={required === "private" || required === "top-secret"
                ? "This institutional resource is restricted to executive clearance." 
                : "This resource requires Inner Circle membership."}
              requiredTier={required}
              onUnlocked={() => void loadLockedContent()}
              onGoToJoin={handleGoToJoin}
            />
          </div>
        </div>
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
              <span>{required} Clearance</span>
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
          {locked && !bodyCode && (
            <div className="mt-16 max-w-2xl">
              <AccessGate
                title={resource.title}
                message={required === "private" || required === "top-secret"
                  ? "This institutional resource is restricted to executive clearance." 
                  : "This resource requires Inner Circle membership."}
                requiredTier={required}
                onUnlocked={() => void loadLockedContent()}
                onGoToJoin={handleGoToJoin}
              />
            </div>
          )}

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

          {bodyCode && (
            <div className="mt-16 prose prose-invert prose-amber max-w-none">
              <SafeMDXRenderer code={bodyCode} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ResourceSlugPage;