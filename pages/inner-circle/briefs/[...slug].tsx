/* pages/inner-circle/briefs/[...slug].tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ShieldCheck, Lock, ChevronLeft } from "lucide-react";

import Layout from "@/components/Layout";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";
import { getRenderableBody } from "@/lib/content/render-body";

type Props = {
  brief: any;
  bodyCode: string;
  accessTier: string;
};

function safeString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function normalizePathish(input: unknown): string {
  return safeString(input)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function getBriefRouteSlug(brief: any): string {
  return normalizePathish(brief?.slug || brief?._raw?.flattenedPath || "");
}

function findBriefInList(slug: string, briefs: any[]) {
  const needle = normalizePathish(slug);
  return briefs.find((b: any) => getBriefRouteSlug(b) === needle) || null;
}

const BriefDetailPage: NextPage<Props> = ({ brief, bodyCode, accessTier }) => {
  const title = safeString(brief?.title) || "Untitled Brief";
  const subtitle = safeString(brief?.subtitle);

  return (
    <Layout title={`${title} | Abraham of London`}>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="min-h-screen bg-white px-6 py-20">
        <article className="mx-auto max-w-4xl">
          <Link
            href="/inner-circle/dashboard"
            className="mb-10 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black"
          >
            <ChevronLeft size={14} />
            Return to Vault
          </Link>

          <header className="mb-12 border-b border-gray-100 pb-12">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700">
                <ShieldCheck size={12} />
                Institutional Intelligence
              </span>

              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-300">
                Ref: {safeString(brief?._id).slice(0, 8) || "N/A"}
              </span>

              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-300">
                Tier: {accessTier}
              </span>
            </div>

            <h1 className="mb-4 font-serif text-5xl font-bold italic tracking-tighter text-gray-900 md:text-6xl">
              {title}
            </h1>

            {subtitle ? (
              <p className="text-xl font-light italic text-gray-500">
                {subtitle}
              </p>
            ) : null}
          </header>

          <div className="prose prose-blue max-w-none prose-headings:font-serif prose-headings:italic prose-p:leading-relaxed prose-p:text-gray-700">
            <SafeMDXRenderer code={bodyCode} />
          </div>

          <footer className="mt-20 border-t border-gray-100 pt-10">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                End of Manuscript
              </div>
              <Lock className="text-gray-200" size={20} />
            </div>
          </footer>
        </article>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const rawSlug = Array.isArray(context.params?.slug)
    ? context.params?.slug.join("/")
    : safeString(context.params?.slug);

  const slug = normalizePathish(rawSlug);
  if (!slug) return { notFound: true };

  const [
    { readAccessCookie },
    { getSessionContext, tierAtLeast },
  ] = await Promise.all([
    import("@/lib/server/auth/cookies"),
    import("@/lib/server/auth/tokenStore.postgres"),
  ]);

  const sessionId = readAccessCookie(context.req as any);
  if (!sessionId) {
    return {
      redirect: {
        destination: `/inner-circle?returnTo=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    };
  }

  const ctx = await getSessionContext(sessionId);
  if (!ctx.ok || !ctx.valid) {
    return {
      redirect: {
        destination: "/inner-circle",
        permanent: false,
      },
    };
  }

  if (!tierAtLeast(ctx.tier, "inner-circle")) {
    return {
      redirect: {
        destination: "/inner-circle/locked",
        permanent: false,
      },
    };
  }

  // Per-kind helper — avoids bundling `contentlayer/generated`.
  const { getAllBriefs } = await import("@/lib/content/server");
  const allBriefs = (getAllBriefs() || []) as any[];
  const brief = findBriefInList(slug, allBriefs);
  if (!brief) return { notFound: true };

  const renderBody = getRenderableBody(brief);

  return {
    props: {
      brief: JSON.parse(JSON.stringify(brief)),
      bodyCode: renderBody.code,
      accessTier: safeString(ctx.tier) || "inner-circle",
    },
  };

};

export default BriefDetailPage;
