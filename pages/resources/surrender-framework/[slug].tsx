/* pages/resources/surrender-framework/[slug].tsx — SSOT, SSG-SAFE, BUILD-PROOF */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, Lock, Shield } from "lucide-react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";

import {
  getAllCombinedDocs,
  getDocBySlug,
  normalizeSlug,
  isDraftContent,
  sanitizeData,
} from "@/lib/content/server";

import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

type FrameworkMeta = {
  title: string;
  excerpt: string | null;
  description: string | null;
  slug: string;
  date: string | null;
  tags: string[];
  author: string | null;
  coverImage: string | null;
};

type Props = {
  slug: string;
  framework: FrameworkMeta;
  requiredTier: AccessTier;
  locked: boolean;
  initialBodyCode: string | null;
};

type ApiOk = { ok: true; tier: AccessTier; requiredTier: AccessTier; bodyCode: string };
type ApiFail = { ok: false; reason: string };

function stripExt(s: string) {
  return String(s || "").replace(/\.(md|mdx)$/i, "");
}

function toSafeSlug(input: string) {
  const s = normalizeSlug(input);
  if (!s || s.includes("..") || s.includes("\\") || s.includes("//")) return "";
  return s.replace(/^\/+/, "").replace(/\/+$/, "");
}

function isSurrenderFrameworkDoc(d: any): boolean {
  const dir = String(d?._raw?.sourceFileDir || "").toLowerCase().replace(/\\/g, "/");
  const flat = String(d?._raw?.flattenedPath || "").toLowerCase().replace(/\\/g, "/");
  return dir.includes("resources/surrender-framework") || flat.startsWith("resources/surrender-framework/");
}

function slugFromDoc(d: any): string {
  const raw =
    toSafeSlug(String(d?.slug || "")) ||
    toSafeSlug(String(d?._raw?.flattenedPath || "")) ||
    "";

  const noExt = stripExt(raw);
  // raw may be "resources/surrender-framework/foo"
  const normalized = noExt.replace(/^resources\/surrender-framework\//, "");
  return toSafeSlug(normalized);
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const docs = getAllCombinedDocs();
    const candidates = docs
      .filter(isSurrenderFrameworkDoc)
      .filter((d: any) => !isDraftContent(d));

    const slugs = Array.from(new Set(candidates.map(slugFromDoc).filter(Boolean)));

    return {
      paths: slugs.map((slug) => ({ params: { slug } })),
      fallback: "blocking",
    };
  } catch (e) {
    console.error("[surrender-framework] getStaticPaths failed:", e);
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const slug = toSafeSlug(String(ctx.params?.slug || ""));
  if (!slug) return { notFound: true };

  const keyA = `resources/surrender-framework/${slug}`;
  const keyB = `surrender-framework/${slug}`;

  const doc = getDocBySlug(keyA) || getDocBySlug(keyB);
  if (!doc || !isSurrenderFrameworkDoc(doc) || isDraftContent(doc)) return { notFound: true };

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));
  const locked = requiredTier !== "public";

  const initialBodyCode = !locked ? (doc.body?.code || (doc as any).bodyCode || null) : null;

  const meta: FrameworkMeta = {
    title: (doc as any).title || "Surrender Framework",
    excerpt: (doc as any).excerpt || null,
    description: (doc as any).description || null,
    slug,
    date: (doc as any).date || null,
    tags: Array.isArray((doc as any).tags) ? (doc as any).tags : [],
    author: (doc as any).author || null,
    coverImage: (doc as any).coverImage || null,
  };

  return {
    props: sanitizeData({
      slug,
      framework: meta,
      requiredTier,
      locked,
      initialBodyCode,
    }),
    revalidate: 3600,
  };
};

const SurrenderFrameworkSlugPage: NextPage<Props> = ({ slug, framework, requiredTier, locked, initialBodyCode }) => {
  const { data: session, status } = useSession();

  const [bodyCode, setBodyCode] = React.useState<string | null>(initialBodyCode);
  const [loading, setLoading] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const required = tiers.normalizeRequired(requiredTier);
  const user = tiers.normalizeUser(session?.user?.tier ?? "public");

  const needsAuth = required !== "public";
  const canAccess = tiers.hasAccess(user, required);

  const canonicalUrl = `${SITE}/resources/surrender-framework/${encodeURIComponent(slug)}`;

  async function unlock(): Promise<void> {
    setErrMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/frameworks/surrender/${encodeURIComponent(slug)}/protected`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const json = (await res.json()) as ApiOk | ApiFail;
      if (!res.ok || !json || (json as any).ok === false) {
        setErrMsg((json as ApiFail)?.reason || "Access denied");
        return;
      }

      const ok = json as ApiOk;
      if (!ok.bodyCode) {
        setErrMsg("Invalid payload");
        return;
      }

      setBodyCode(ok.bodyCode);
    } catch {
      setErrMsg("Failed to unlock content");
    } finally {
      setLoading(false);
    }
  }

  // SSR/prerender shell
  if (!mounted) {
    return (
      <Layout title={framework.title}>
        <div className="min-h-screen bg-black" />
      </Layout>
    );
  }

  if (needsAuth && status === "loading") {
    return (
      <Layout title={framework.title}>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-amber-500 font-mono text-xs animate-pulse">Verifying clearance...</div>
        </div>
      </Layout>
    );
  }

  if (needsAuth && (!session?.user || !canAccess)) {
    return (
      <Layout title={framework.title}>
        <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 text-white">
          <div className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="mx-auto max-w-5xl px-6 py-4">
              <Link
                href="/resources/surrender-framework"
                className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                <span className="font-mono text-[10px] uppercase tracking-widest">Back to Surrender Hub</span>
              </Link>
            </div>
          </div>

          <div className="mx-auto max-w-5xl px-6 py-20">
            <AccessGate
              title={framework.title}
              requiredTier={required}
              message="This framework is restricted. Verify credentials to access full content."
              onUnlocked={() => void unlock()}
              onGoToJoin={() => (window.location.href = "/inner-circle")}
            />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={framework.title} description={framework.description || framework.excerpt || undefined}>
      <Head>
        <title>{framework.title} | Surrender Framework</title>
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={framework.title} />
        <meta property="og:description" content={framework.description || framework.excerpt || ""} />
        {framework.coverImage ? <meta property="og:image" content={framework.coverImage} /> : null}
        <meta name="robots" content={locked ? "noindex,nofollow" : "index,follow"} />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 text-white">
        <div className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <Link href="/resources/surrender-framework" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors">
              <ArrowLeft size={16} />
              <span className="font-mono text-[10px] uppercase tracking-widest">Back</span>
            </Link>

            <div className="flex items-center gap-3 text-amber-500 font-mono text-[10px] uppercase tracking-[0.3em]">
              <Shield size={14} />
              <span>{required} clearance</span>
              {required !== "public" ? <Lock size={14} /> : null}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <header className="mb-14">
            <h1 className="font-serif text-5xl md:text-7xl font-bold leading-tight tracking-tight">{framework.title}</h1>
            {(framework.description || framework.excerpt) && (
              <p className="mt-6 text-xl text-white/50 leading-relaxed max-w-3xl">
                {framework.description || framework.excerpt}
              </p>
            )}
          </header>

          {locked && !bodyCode && (
            <div className="max-w-2xl">
              <AccessGate
                title={framework.title}
                requiredTier={required}
                message="This framework is restricted. Verify credentials to access full content."
                onUnlocked={() => void unlock()}
                onGoToJoin={() => (window.location.href = "/inner-circle")}
              />
            </div>
          )}

          {loading && (
            <div className="mt-10 flex items-center gap-3 text-amber-500">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-[10px] uppercase tracking-widest">Decrypting framework…</span>
            </div>
          )}

          {errMsg && (
            <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-4 text-sm text-red-200">
              {errMsg}
            </div>
          )}

          {bodyCode && (
            <article className="mt-14 prose prose-invert prose-amber max-w-none">
              <SafeMDXRenderer code={bodyCode} />
            </article>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SurrenderFrameworkSlugPage;