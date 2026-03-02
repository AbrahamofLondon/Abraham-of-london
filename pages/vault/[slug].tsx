/* pages/vault/briefs/[slug].tsx — BRIEF READER (canonical route that matches your MDX links) */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";

import tiers, { requiredTierFromDoc, type AccessTier } from "@/lib/access/tiers";
import { allBriefs } from "@/lib/contentlayer";
import { normalizeSlug } from "@/lib/content/shared";

type Props = {
  brief: any;
  requiredTier: AccessTier;
  bodyCode: string; // compiled MDX code (public ships at build time)
};

function toBareBriefSlug(input: string) {
  const n = normalizeSlug(input || "");
  return n
    .replace(/^vault\/briefs\//i, "")
    .replace(/^\/vault\/briefs\//i, "")
    .replace(/^briefs\//i, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = (allBriefs || [])
    .filter((b: any) => !b?.draft)
    .map((b: any) => ({ params: { slug: toBareBriefSlug(b.slug || b._raw?.flattenedPath || "") } }))
    .filter((x: any) => x?.params?.slug);

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const param = String(params?.slug || "");
  const bare = toBareBriefSlug(param);
  if (!bare) return { notFound: true };

  const wantA = `vault/briefs/${bare}`;
  const wantB = `briefs/${bare}`;

  const doc =
    (allBriefs || []).find((b: any) => normalizeSlug(b.slug || "") === normalizeSlug(wantA)) ||
    (allBriefs || []).find((b: any) => normalizeSlug(b._raw?.flattenedPath || "") === normalizeSlug(wantA)) ||
    (allBriefs || []).find((b: any) => normalizeSlug(b.slug || "") === normalizeSlug(wantB)) ||
    (allBriefs || []).find((b: any) => normalizeSlug(b._raw?.flattenedPath || "") === normalizeSlug(wantB)) ||
    (allBriefs || []).find((b: any) => toBareBriefSlug(b.slug || b._raw?.flattenedPath || "") === bare);

  if (!doc || doc?.draft) return { notFound: true };

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));
  const locked = requiredTier !== "public";

  const bodyCode = locked ? "" : String(doc?.body?.code || doc?.bodyCode || "");

  return {
    props: {
      brief: { ...doc, slug: `/vault/briefs/${bare}` },
      requiredTier,
      bodyCode,
    },
    revalidate: 1800,
  };
};

const BriefSlugPage: NextPage<Props> = ({ brief, requiredTier, bodyCode }) => {
  const { data: session, status } = useSession();

  const required = tiers.normalizeRequired(requiredTier);
  const user = tiers.normalizeUser((session?.user as any)?.tier ?? "public");

  const needsAuth = required !== "public";
  const canRead = !needsAuth || (session?.user ? tiers.hasAccess(user, required) : false);

  // Public: always render (no auth waiting)
  if (needsAuth && status === "loading") {
    return (
      <Layout title={brief?.title || "Brief"}>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-amber-500 font-mono text-xs animate-pulse">Verifying clearance…</div>
        </div>
      </Layout>
    );
  }

  if (needsAuth && (!session?.user || !canRead)) {
    return (
      <Layout title={brief?.title || "Brief"}>
        <div className="min-h-screen bg-black flex items-center justify-center px-6">
          <AccessGate
            title={brief?.title || "Intelligence Brief"}
            requiredTier={required}
            message="This intelligence brief requires appropriate clearance."
            onGoToJoin={() => window.location.assign("/inner-circle")}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${brief?.title || "Brief"} // Vault`} canonicalUrl={`/vault/briefs/${toBareBriefSlug(brief?.slug || "")}`} className="bg-black text-white" fullWidth headerTransparent={false}>
      <Head>
        <title>{brief?.title || "Brief"} // Vault</title>
        <meta name="robots" content={required === "public" ? "index, follow" : "noindex, nofollow"} />
      </Head>

      <main className="min-h-screen bg-[#050505] pt-28 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-10">
            <Link
              href="/vault/briefs"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 hover:bg-white/[0.05] transition-colors"
            >
              <span className="aol-micro text-white/55">Back to Briefs</span>
            </Link>

            {required !== "public" ? (
              <span className="inline-flex items-center gap-2 px-3 py-1 border border-amber-500/30 bg-amber-500/10 rounded-full text-amber-200/80 text-[10px] font-mono uppercase tracking-[0.25em]">
                <Lock className="h-3 w-3" />
                {tiers.getLabel(required)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1 border border-emerald-500/20 bg-emerald-500/10 rounded-full text-emerald-200/80 text-[10px] font-mono uppercase tracking-[0.25em]">
                <ShieldCheck className="h-3 w-3" />
                Public
              </span>
            )}
          </div>

          <header className="mb-10 border-b border-white/10 pb-8">
            <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
              Vault Brief • {String(brief?.series || brief?.category || "Briefing")}
            </div>
            <h1 className="mt-4 text-4xl md:text-5xl font-serif italic text-white/95">
              {brief?.title || "Untitled Brief"}
            </h1>
            {brief?.excerpt || brief?.description ? (
              <p className="mt-4 text-sm md:text-base text-white/55 leading-relaxed">
                {String(brief?.excerpt || brief?.description)}
              </p>
            ) : null}
          </header>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.02] p-7 md:p-10">
            <SafeMDXRenderer code={needsAuth ? String(brief?.body?.code || brief?.bodyCode || "") : bodyCode} />
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default BriefSlugPage;