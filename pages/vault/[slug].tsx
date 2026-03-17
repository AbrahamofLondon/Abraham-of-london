/* pages/vault/[slug].tsx — REFINED & ROBUST */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useSession } from "next-auth/react";
import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";

import { normalizeUserTier, hasAccess, requiredTierFromDoc } from "@/lib/access/tier-policy";
import type { AccessTier } from "@/lib/access/tier-policy";
import type { TierDirective } from "@/lib/resources/tier-metadata";

// DEFENSIVE IMPORT
import * as ContentSource from "contentlayer/generated";

function toBareSlug(input: string) {
  return input.split('/').pop()?.replace(/\.(md|mdx)$/i, "") || "";
}

export const getStaticPaths: GetStaticPaths = async () => {
  const allBriefs = (ContentSource as any).allBriefs || [];
  const paths = allBriefs
    .filter((b: any) => !b.draft)
    .map((b: any) => ({ params: { slug: toBareSlug(b.slug || b._raw.flattenedPath) } }));

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slugParam = String(params?.slug || "");
  const allBriefs = (ContentSource as any).allBriefs || [];
  const doc = allBriefs.find((b: any) => toBareSlug(b.slug || b._raw.flattenedPath) === slugParam);

  if (!doc) return { notFound: true };

  return {
    props: {
      brief: JSON.parse(JSON.stringify(doc)),
      requiredTier: requiredTierFromDoc(doc),
    },
    revalidate: 1800,
  };
};

const VaultSlugPage: NextPage<{ brief: any; requiredTier: AccessTier }> = ({ brief, requiredTier }) => {
  const { data: session, status } = useSession();
  
  // ✅ Extraction of Governance Data
  const userTier = normalizeUserTier((session?.user as any)?.tier);
  const directive = (session?.user as any)?.directive as TierDirective | undefined;
  const canRead = hasAccess(userTier, requiredTier);

  if (status === "loading") return <div className="min-h-screen bg-black" />;
  
  if (!canRead) {
    return (
      <Layout title="Restricted">
        <AccessGate title={brief.title} requiredTier={requiredTier} />
      </Layout>
    );
  }

  return (
    <Layout title={`${brief.title} // Vault`} className="bg-black text-white">
      <main className="min-h-screen pt-28 pb-20 px-6 max-w-4xl mx-auto">
        <header className="mb-10 border-b border-white/10 pb-8">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-500/60">
              Institutional Intel // {requiredTier}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif italic text-white/95 leading-tight">
            {brief.title}
          </h1>
        </header>

        {/* ✅ The Container for the content */}
        <section className="rounded-[28px] border border-white/5 bg-white/[0.005] p-7 md:p-12 shadow-2xl">
          <article className="prose prose-invert prose-emerald max-w-none">
            {/* ✅ We pass the directive here so components inside SafeMDXRenderer can use it */}
            <SafeMDXRenderer 
              code={brief.body.code} 
              directive={directive} 
            />
          </article>
        </section>
      </main>
    </Layout>
  );
};

export default VaultSlugPage;