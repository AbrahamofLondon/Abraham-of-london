/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/vault/briefs/[slug].tsx

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronLeft, ShieldCheck, Terminal, Loader2 } from "lucide-react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";
import Note from "@/components/mdx/Note";
import BriefAlert from "@/components/mdx/BriefAlert";
import DocumentFooter from "@/components/mdx/DocumentFooter";
import DocumentHeader from "@/components/mdx/DocumentHeader";
import Callout from "@/components/mdx/Callout";
import Quote from "@/components/mdx/Quote";
import DataTable from "@/components/mdx/DataTable";
import { BriefSummaryCard } from "@/components/mdx/BriefSummaryCard";

import { resolveDocCoverImage } from "@/lib/content/client-utils";
import {
  getAllCombinedDocs,
  sanitizeData,
  normalizeSlug as normalizeContentSlug,
} from "@/lib/content/server";
import { getRenderableBody } from "@/lib/content/render-body";
import { decodeBodyCodePayload } from "@/lib/content/client-codec";

import type { TierDirective } from "@/lib/resources/tier-metadata";
import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";

type BriefRecommendation = {
  slug: string;
  title: string;
};

type Props = {
  brief: any;
  recommendations: BriefRecommendation[];
  requiredTier: AccessTier;
  bareSlug: string;
};

const DEFAULT_COVER = "/assets/images/blog/default-blog-cover.jpg";

function safeString(v: unknown): string {
  if (typeof v === "string") return v;
  if (v == null) return "";
  return String(v);
}

function safeArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function cleanPathish(input: unknown): string {
  return safeString(input)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function stripPrefixOnce(source: string, prefix: string): string {
  const normalizedPrefix = `${prefix.toLowerCase()}/`;
  if (source.toLowerCase().startsWith(normalizedPrefix)) {
    return source.slice(normalizedPrefix.length).replace(/^\/+/, "");
  }
  return source;
}

function briefsBareSlug(input: unknown): string {
  let s = cleanPathish(
    normalizeContentSlug(safeString(input))
      .replace(/\.(md|mdx)$/i, "")
      .replace(/^content\//i, "")
      .replace(/^vault\//i, "")
      .replace(/^briefs\//i, ""),
  );

  if (!s || s.includes("..")) return "";

  let changed = true;
  while (changed) {
    changed = false;

    const nextA = stripPrefixOnce(s, "content");
    if (nextA !== s) {
      s = nextA;
      changed = true;
    }

    const nextB = stripPrefixOnce(s, "vault");
    if (nextB !== s) {
      s = nextB;
      changed = true;
    }

    const nextC = stripPrefixOnce(s, "briefs");
    if (nextC !== s) {
      s = nextC;
      changed = true;
    }
  }

  s = cleanPathish(s);
  if (!s || s.includes("..")) return "";

  const parts = s.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function isBriefDoc(doc: any): boolean {
  if (!doc) return false;

  const docKind = safeString(doc?.docKind).toLowerCase();
  const type = safeString(doc?.type || doc?._type).toLowerCase();
  const kind = safeString(doc?.kind).toLowerCase();
  const category = safeString(doc?.category).toLowerCase();
  const series = safeString(doc?.series).toLowerCase();
  const flattened = safeString(doc?._raw?.flattenedPath).toLowerCase();
  const sourceFilePath = safeString(doc?._raw?.sourceFilePath).toLowerCase();
  const slug = safeString(doc?.slug).toLowerCase();

  return (
    docKind === "brief" ||
    type.includes("brief") ||
    kind.includes("brief") ||
    category.includes("brief") ||
    series.includes("brief") ||
    flattened.startsWith("briefs/") ||
    flattened.startsWith("content/briefs/") ||
    flattened.startsWith("vault/briefs/") ||
    sourceFilePath.startsWith("briefs/") ||
    sourceFilePath.startsWith("content/briefs/") ||
    sourceFilePath.startsWith("vault/briefs/") ||
    slug.startsWith("briefs/") ||
    slug.startsWith("vault/briefs/")
  );
}

function getCombinedBriefs(): any[] {
  const seen = new Set<string>();

  return (getAllCombinedDocs() || [])
    .filter((doc: any) => doc && typeof doc === "object" && !doc?.draft)
    .filter(isBriefDoc)
    .filter((doc: any) => {
      const key = safeString(
        doc?._id || doc?._raw?.flattenedPath || doc?.slug,
      ).toLowerCase();

      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function looksLikeLeakedModuleCode(code: string): boolean {
  const s = safeString(code).trim();
  if (!s) return false;

  return (
    /\bObject\.defineProperty\s*\(\s*exports\b/.test(s) ||
    /\bmodule\.exports\b/.test(s) ||
    /\bexports\.[A-Za-z_$]/.test(s) ||
    /\b__esModule\b/.test(s) ||
    /\brequire\s*\(/.test(s) ||
    /\bjsx_runtime\b/.test(s) ||
    /\bvar\s+\w+\s*=\s*Object\.create/.test(s)
  );
}

function pickRenderableBriefCode(doc: any, renderBody?: any): string {
  const compiled =
    safeString(renderBody?.code) ||
    safeString(doc?.body?.code) ||
    safeString(doc?.bodyCode);

  const raw =
    safeString(renderBody?.raw) ||
    safeString(doc?.body?.raw) ||
    safeString(doc?.content);

  if (compiled && !looksLikeLeakedModuleCode(compiled)) {
    return compiled;
  }

  if (raw) {
    return raw;
  }

  return compiled || "";
}

function getMdxComponents(directive?: TierDirective) {
  return {
    h1: (p: any) => (
      <h1 className="mb-6 mt-12 font-serif text-3xl italic text-white md:text-4xl" {...p} />
    ),
    h2: (p: any) => (
      <h2 className="mb-4 mt-10 font-serif text-2xl text-white/90 md:text-3xl" {...p} />
    ),
    h3: (p: any) => (
      <h3
        className="mb-2 mt-8 font-mono text-xs uppercase tracking-[0.3em] text-amber-500/80"
        {...p}
      />
    ),
    p: (p: any) => (
      <p className="mb-6 font-light leading-relaxed text-white/60" {...p} />
    ),
    ul: (p: any) => (
      <ul className="mb-6 list-none space-y-3 border-l border-white/10 pl-4" {...p} />
    ),
    li: (p: any) => (
      <li
        className="text-sm text-white/50 before:mr-3 before:content-['//'] before:text-amber-500/40"
        {...p}
      />
    ),
    a: ({ href, children, ...props }: any) => {
      const rawHref = safeString(href);
      const normalizedHref = rawHref.includes("brief")
        ? `/vault/briefs/${briefsBareSlug(rawHref)}`
        : rawHref;

      return (
        <Link
          href={normalizedHref || "#"}
          className="text-emerald-400 underline underline-offset-4 transition-colors hover:text-emerald-300"
          {...props}
        >
          {children}
        </Link>
      );
    },
    Note: (p: any) => <Note {...p} />,
    BriefAlert: (p: any) => <BriefAlert {...p} />,
    Callout: (p: any) => <Callout {...p} />,
    Quote: (p: any) => <Quote {...p} />,
    DataTable: (p: any) => <DataTable {...p} />,
    DocumentHeader: (p: any) => <DocumentHeader {...p} />,
    DocumentFooter: (p: any) => <DocumentFooter {...p} directive={directive} />,
  };
}

const BriefPage: NextPage<Props> = ({
  brief,
  recommendations,
  requiredTier,
  bareSlug,
}) => {
  const { data: session, status } = useSession();

  const title = safeString(brief?.title) || "Untitled Brief";
  const summary =
    safeString(brief?.summary) ||
    safeString(brief?.abstract) ||
    safeString(brief?.excerpt);
  const coverImage = resolveDocCoverImage(brief) || DEFAULT_COVER;

  const required = normalizeRequiredTier(requiredTier);
  const needsAuth = required !== "public";

  const userTier = normalizeUserTier(
    (session?.user as any)?.tier ??
      (session as any)?.aol?.tier ??
      "public",
  );

  const canRead = !needsAuth || (!!session?.user && hasAccess(userTier, required));
  const directive = (session?.user as any)?.directive as TierDirective | undefined;

  const [activeCode, setActiveCode] = React.useState<string>(
    requiredTier === "public" ? safeString(brief?.bodyCode) : "",
  );
  const [loadingContent, setLoadingContent] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);

  const mdxComponents = React.useMemo(
    () => getMdxComponents(directive),
    [directive],
  );

  const handleUnlock = React.useCallback(async () => {
    if (!needsAuth || !bareSlug) return;

    setUnlockError(null);
    setLoadingContent(true);

    try {
      const res = await fetch(`/api/briefs/${encodeURIComponent(bareSlug)}`, {
        method: "GET",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        setUnlockError(json?.reason || "UNLOCK_FAILED");
        return;
      }

      const decoded = decodeBodyCodePayload(json);
      const raw = safeString((json as any)?.body?.raw || (json as any)?.content);
      const nextCode =
        decoded.trim() && !looksLikeLeakedModuleCode(decoded) ? decoded : raw;

      if (nextCode.trim()) {
        setActiveCode(nextCode);
      } else {
        setUnlockError("UNLOCK_PAYLOAD_MISSING");
      }
    } catch {
      setUnlockError("UNLOCK_NETWORK_FAILURE");
    } finally {
      setLoadingContent(false);
    }
  }, [bareSlug, needsAuth]);

  if (needsAuth && status === "loading") {
    return (
      <Layout title={title}>
        <div className="flex min-h-screen items-center justify-center bg-black">
          <div className="animate-pulse font-mono text-xs text-amber-500">
            Verifying clearance...
          </div>
        </div>
      </Layout>
    );
  }

  if (needsAuth && (!session?.user || !canRead)) {
    return (
      <Layout title={title}>
        <div className="min-h-screen bg-black text-white">
          <section className="mx-auto max-w-7xl px-6 pb-24 pt-24">
            <div className="mb-12 flex items-center justify-between border-b border-white/5 pb-8">
              <Link
                href="/vault/briefs"
                className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-white/30 transition-all hover:text-white"
              >
                <ChevronLeft size={12} /> Return to Index
              </Link>

              <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1">
                <ShieldCheck size={10} className="text-amber-500" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-amber-500/80">
                  {required} Clearance
                </span>
              </div>
            </div>

            <header className="mb-16">
              <div className="mb-6 flex items-center gap-3">
                <Terminal size={14} className="text-amber-500" />
                <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">
                  Intelligence Dossier
                </span>
              </div>

              <h1 className="mb-8 font-serif text-5xl italic leading-tight md:text-7xl">
                {title}
              </h1>

              {summary ? (
                <p className="max-w-3xl border-l-2 border-amber-500/20 pl-8 text-xl font-light italic leading-relaxed text-white/40">
                  {summary}
                </p>
              ) : null}
            </header>

            <BriefSummaryCard classification={required} />

            <div className="mt-16">
              <AccessGate
                title={title}
                requiredTier={required}
                onUnlocked={handleUnlock}
                message={
                  safeString(brief?.lockMessage) ||
                  "This briefing requires the appropriate clearance level."
                }
                onGoToJoin={() => window.location.assign("/inner-circle")}
              />

              {unlockError ? (
                <div className="mt-6 text-center text-[10px] font-mono uppercase tracking-widest text-red-400/90">
                  {unlockError}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${title} // Briefing`} className="bg-black text-white">
      <Head>
        <title>{title} // Briefing</title>
        {summary ? <meta name="description" content={summary} /> : null}
        <meta
          name="robots"
          content={required === "public" ? "index, follow" : "noindex, nofollow"}
        />
      </Head>

      <main className="mx-auto min-h-screen max-w-5xl px-6 pb-24 pt-32">
        <div className="mb-16 flex flex-col items-start justify-between gap-4 border-b border-white/5 pb-8 md:flex-row md:items-center">
          <Link
            href="/vault/briefs"
            className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-white/30 transition-all hover:text-white"
          >
            <ChevronLeft size={12} /> Return to Index
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1">
              <ShieldCheck size={10} className="text-emerald-500" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-500/80">
                {required} Clearance
              </span>
            </div>
            <div className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-white/20 md:block">
              REF_ID: {bareSlug.toUpperCase()}
            </div>
          </div>
        </div>

        <header className="mb-20">
          <div className="mb-6 flex items-center gap-3">
            <Terminal size={14} className="text-amber-500" />
            <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">
              Intelligence Dossier
            </span>
          </div>

          <h1 className="mb-8 font-serif text-5xl italic leading-tight md:text-7xl">
            {title}
          </h1>

          {summary ? (
            <p className="max-w-3xl border-l-2 border-amber-500/20 pl-8 text-xl font-light italic leading-relaxed text-white/40">
              {summary}
            </p>
          ) : null}
        </header>

        <BriefSummaryCard classification={required} />

        {coverImage ? (
          <div className="mb-12 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/40">
            <img
              src={coverImage}
              alt={title}
              className="h-auto w-full object-cover"
            />
          </div>
        ) : null}

        <div className="mt-16">
          <div className="relative min-h-[400px]">
            {loadingContent ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : null}

            <div className={loadingContent ? "pointer-events-none opacity-20" : "opacity-100"}>
              <SafeMDXRenderer
                code={activeCode}
                components={mdxComponents as any}
                directive={directive}
              />
            </div>
          </div>
        </div>

        {safeArray(recommendations).length > 0 ? (
          <div className="mt-24 border-t border-white/5 pt-12">
            <h3 className="mb-6 text-[10px] font-mono uppercase tracking-[0.3em] text-white/35">
              Related Briefs
            </h3>

            <div className="grid gap-4 md:grid-cols-3">
              {recommendations.map((item) => (
                <Link
                  key={item.slug}
                  href={`/vault/briefs/${briefsBareSlug(item.slug)}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="text-[10px] font-mono uppercase tracking-widest text-amber-500/70">
                    Recommendation
                  </div>
                  <div className="mt-3 font-serif text-lg italic text-white">
                    {item.title}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-24 flex flex-col gap-12 border-t border-white/5 pt-12 text-white/20 md:flex-row">
          <div className="flex-1">
            <h4 className="mb-4 text-[10px] font-mono uppercase tracking-widest text-white/40">
              Metadata Verification
            </h4>
            <p className="font-mono text-[9px] leading-relaxed">
              Source: {safeString(brief?.series) || "Abraham of London Intelligence"}
              <br />
              Protocol: Secure SSG Hydration
              <br />
              Timestamp: {new Date().toISOString()}
            </p>
          </div>
          <div className="flex-1 text-right">
            <span className="text-[8px] font-mono uppercase tracking-tighter opacity-30">
              All Rights Reserved // Abraham of London // 2026
            </span>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const briefs = getCombinedBriefs();

  const paths = briefs
    .map((doc: any) => {
      const bare = briefsBareSlug(doc?.slug || doc?._raw?.flattenedPath || "");
      if (!bare) return null;
      return { params: { slug: bare } };
    })
    .filter(Boolean) as Array<{ params: { slug: string } }>;

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const bare = briefsBareSlug(params?.slug);
  if (!bare) return { notFound: true };

  const docs = getCombinedBriefs();

  const rawDoc =
    docs.find((doc: any) => {
      const flattened = briefsBareSlug(doc?._raw?.flattenedPath || "");
      const slug = briefsBareSlug(doc?.slug || "");
      return flattened === bare || slug === bare;
    }) || null;

  if (!rawDoc || rawDoc?.draft) {
    return { notFound: true };
  }

  const requiredTier = normalizeRequiredTier(requiredTierFromDoc(rawDoc));
  const locked = requiredTier !== "public";

  const renderBody = getRenderableBody(rawDoc);
  const bodyCode = locked ? "" : pickRenderableBriefCode(rawDoc, renderBody);

  const recommendations: BriefRecommendation[] = docs
    .filter((doc: any) => {
      const docBare = briefsBareSlug(doc?.slug || doc?._raw?.flattenedPath || "");
      return docBare && docBare !== bare;
    })
    .slice(0, 3)
    .map((doc: any) => ({
      slug: briefsBareSlug(doc?.slug || doc?._raw?.flattenedPath || ""),
      title: safeString(doc?.title) || "Untitled Brief",
    }));

  const brief = {
    ...rawDoc,
    slug: bare,
    bodyCode,
    coverImage: resolveDocCoverImage(rawDoc),
  };

  return {
    props: sanitizeData({
      brief,
      recommendations,
      requiredTier,
      bareSlug: bare,
    }),
    revalidate: 1800,
  };
};

export default BriefPage;