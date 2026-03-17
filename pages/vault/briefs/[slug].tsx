/* pages/vault/briefs/[slug].tsx — Dossier Rendering Engine (Permanent Shared Resolver) */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useMDXComponent } from "next-contentlayer2/hooks";
import {
  ChevronLeft,
  ShieldCheck,
  Activity,
  Terminal,
} from "lucide-react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";

import Note from "@/components/mdx/Note";
import BriefAlert from "@/components/mdx/BriefAlert";
import DocumentFooter from "@/components/mdx/DocumentFooter";
import DocumentHeader from "@/components/mdx/DocumentHeader";
import Callout from "@/components/mdx/Callout";
import Quote from "@/components/mdx/Quote";
import DataTable from "@/components/mdx/DataTable";

import prisma from "@/lib/prisma";
import {
  normalizeUserTier,
  hasAccess,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";
import type { AccessTier } from "@/lib/access/tier-policy";
import type { TierDirective } from "@/lib/resources/tier-metadata";
import { normalizeSlug as normalizeContentSlug } from "@/lib/content/server";
import * as ContentSource from "contentlayer/generated";

function safeString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function safeArray<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function normalizeBriefSlug(input: unknown): string {
  const raw = normalizeContentSlug(String(input || ""))
    .replace(/^content\//i, "")
    .replace(/^vault\/briefs\//i, "")
    .replace(/^briefs\//i, "")
    .replace(/\.(md|mdx)$/i, "")
    .replace(/^\/+|\/+$/g, "");

  const parts = raw.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function getAllContentCandidates(): any[] {
  const source = ContentSource as any;

  return [
    ...safeArray(source.allBriefs),
    ...safeArray(source.allVaultBriefs),
    ...safeArray(source.allDocuments),
    ...safeArray(source.allResources),
    ...safeArray(source.allPosts),
    ...safeArray(source.allCanon),
    ...safeArray(source.allDispatches),
  ];
}

function isBriefDoc(doc: any): boolean {
  const flattened = safeString(doc?._raw?.flattenedPath).toLowerCase();
  const slug = safeString(doc?.slug).toLowerCase();
  const type = safeString(doc?.type || doc?._type).toLowerCase();
  const kind = safeString(doc?.kind).toLowerCase();
  const category = safeString(doc?.category).toLowerCase();
  const series = safeString(doc?.series).toLowerCase();

  return (
    flattened.includes("vault/briefs/") ||
    flattened.startsWith("briefs/") ||
    flattened.includes("/briefs/") ||
    slug.includes("vault/briefs/") ||
    slug.startsWith("briefs/") ||
    slug.includes("/briefs/") ||
    type.includes("brief") ||
    kind.includes("brief") ||
    category.includes("brief") ||
    series.includes("brief")
  );
}

function getCombinedBriefs(): any[] {
  const seen = new Set<string>();

  return getAllContentCandidates()
    .filter((doc: any) => doc && typeof doc === "object" && !doc?.draft)
    .filter(isBriefDoc)
    .filter((doc: any) => {
      const key = safeString(doc?._id || doc?._raw?.flattenedPath || doc?.slug).toLowerCase();
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

const getMdxComponents = (directive?: TierDirective) => ({
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
    <ul
      className="mb-6 list-none space-y-3 border-l border-white/10 pl-4"
      {...p}
    />
  ),
  li: (p: any) => (
    <li
      className="text-sm text-white/50 before:mr-3 before:content-['//'] before:text-amber-500/40"
      {...p}
    />
  ),
  a: ({ href, children, ...props }: any) => {
    const rawHref = safeString(href);
    const normalizedHref = rawHref.includes("brief-")
      ? `/vault/briefs/${normalizeBriefSlug(rawHref)}`
      : rawHref;

    return (
      <Link
        href={normalizedHref}
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
});

export const getStaticPaths: GetStaticPaths = async () => {
  const combined = getCombinedBriefs();

  const paths = combined
    .map((b: any) => ({
      params: { slug: normalizeBriefSlug(b?.slug || b?._raw?.flattenedPath) },
    }))
    .filter((p: any) => p.params.slug);

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slugParam = normalizeBriefSlug(params?.slug);
  const combined = getCombinedBriefs();

  const doc = combined.find(
    (b: any) => normalizeBriefSlug(b?.slug || b?._raw?.flattenedPath) === slugParam
  );

  if (!doc) return { notFound: true };

  const requiredTier = requiredTierFromDoc(doc);
  let recommendations: any[] = [];

  if (prisma) {
    try {
      const meta = await prisma.contentMetadata.findFirst({
        where: { slug: slugParam },
      });

      if (meta?.id) {
        recommendations = await prisma.$queryRawUnsafe(
          `SELECT slug, title FROM "content_metadata" WHERE id != $1 AND embedding IS NOT NULL ORDER BY embedding <=> (SELECT embedding FROM "content_metadata" WHERE id = $1) LIMIT 3`,
          meta.id
        );
      }
    } catch {
      // silent during SSG
    }
  }

  return {
    props: {
      brief: JSON.parse(JSON.stringify(doc)),
      recommendations: JSON.parse(JSON.stringify(recommendations)),
      requiredTier,
    },
    revalidate: 1800,
  };
};

const BriefPage: NextPage<{
  brief: any;
  recommendations: any[];
  requiredTier: AccessTier;
}> = ({ brief, requiredTier }) => {
  const { data: session, status } = useSession();
  const MDXContent = useMDXComponent(brief.body.code);

  const userTier = normalizeUserTier(
    (((session?.user as any)?.tier || (session as any)?.aol?.tier || "public") as string)
  );

  const canAccess = hasAccess(userTier, requiredTier);
  const directive = (session?.user as any)?.directive;

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Activity size={24} className="animate-pulse text-amber-500" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <Layout title="Restricted Access">
        <AccessGate title={brief.title} requiredTier={requiredTier} />
      </Layout>
    );
  }

  return (
    <Layout title={`${brief.title} // Briefing`} className="bg-black text-white">
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
                {requiredTier} Clearance
              </span>
            </div>
            <div className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-white/20 md:block">
              REF_ID: {brief.slug?.toUpperCase() || "AOL_X"}
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
            {brief.title}
          </h1>

          {(brief.summary || brief.abstract || brief.excerpt) && (
            <p className="max-w-3xl border-l-2 border-amber-500/20 pl-8 text-xl font-light italic leading-relaxed text-white/40">
              {brief.summary || brief.abstract || brief.excerpt}
            </p>
          )}
        </header>

        <article
          className="prose prose-invert prose-emerald max-w-none
          prose-headings:font-serif prose-p:text-white/60 prose-strong:text-amber-500
          prose-code:rounded prose-code:bg-emerald-500/5 prose-code:px-1 prose-code:text-emerald-400"
        >
          <MDXContent components={getMdxComponents(directive) as any} />
        </article>

        <div className="mt-24 flex flex-col gap-12 border-t border-white/5 pt-12 text-white/20 md:flex-row">
          <div className="flex-1">
            <h4 className="mb-4 text-[10px] font-mono uppercase tracking-widest text-white/40">
              Metadata Verification
            </h4>
            <p className="font-mono text-[9px] leading-relaxed">
              Source: {brief.series || "Abraham of London Intelligence"}
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

export default BriefPage;