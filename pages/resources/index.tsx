/* pages/resources/index.tsx — RESOURCE VAULT (BUILD-SAFE) */
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import Layout from "@/components/Layout";
import { getContentlayerData } from "@/lib/content/server";
// ✅ Using centralized shared utilities for path integrity
import { normalizeSlug, joinHref } from "@/lib/content/shared";
import { safeSlice } from "@/lib/utils/safe";

type ResourceMeta = {
  slug: string;
  title: string;
  description: string | null;
  subtitle: string | null;
  date: string | null;
  readTime: string | null;
  image: string | null;
  tags: string[];
  author: string | null;
  href: string; 
};

type Props = { resources: ResourceMeta[] };

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

function resolveDocCoverImage(doc: any): string | null {
  return doc?.coverImage || doc?.featuredImage || doc?.image || doc?.thumbnail || null;
}

function safeDateISO(d: any): string | null {
  const t = new Date(d ?? "").getTime();
  if (!Number.isFinite(t) || t <= 0) return null;
  return new Date(t).toISOString();
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    const data = getContentlayerData();
    const docs = Array.isArray((data as any).allResources) ? (data as any).allResources : [];

    const resources: ResourceMeta[] = docs
      .map((r: any) => {
        // ✅ STRATEGY: Normalize to bare slug by stripping 'resources/' prefix
        const rawPath = r.slug || r._raw?.flattenedPath || "";
        const bareSlug = normalizeSlug(rawPath).replace(/^resources\//, "");
        const title = String(r?.title || "").trim();

        return {
          slug: bareSlug,
          title: title || "Untitled Resource",
          description: r?.description ?? r?.excerpt ?? null,
          subtitle: r?.subtitle ?? null,
          date: safeDateISO(r?.date),
          readTime: r?.readTime ?? r?.normalizedReadTime ?? null,
          image: resolveDocCoverImage(r),
          tags: Array.isArray(r?.tags) ? r.tags.filter((x: any) => typeof x === "string" && x.trim()) : [],
          author: r?.author ?? null,
          // ✅ FIX: Using joinHref to prevent /resources//resources/ junk
          href: joinHref("resources", bareSlug),
        };
      })
      .filter((x) => Boolean(x.slug) && Boolean(x.title) && x.title !== "Untitled Resource")
      .sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return db - da;
      });

    return { props: { resources }, revalidate: 1800 };
  } catch (error) {
    console.error("[Resources] getStaticProps failed:", error);
    return { props: { resources: [] }, revalidate: 1800 };
  }
};

const ResourcesIndexPage: NextPage<Props> = ({ resources }) => {
  const pageDescription = "Structural assets, frameworks, and tools for fathers, founders, and institutional architects.";

  return (
    <Layout title="Resource Vault" description={pageDescription}>
      <Head>
        <link rel="canonical" href={`${SITE}/resources`} />
      </Head>

      <main className="min-h-screen bg-black text-cream">
        <section className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <header className="mb-16 border-b border-gold/10 pb-12 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">Strategic Assets</span>
            </div>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-cream sm:text-5xl lg:text-6xl">
              The Resource Vault
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg">
              Curated frameworks and structural primers. Architectural tools for those building legacies.
            </p>
          </header>

          {resources.length > 0 ? (
            <div className="grid gap-10 md:grid-cols-2">
              {resources.map((res) => (
                <article key={res.slug} className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] transition-all duration-500 hover:border-gold/30 hover:bg-white/[0.04]">
                  <Link href={res.href} className="flex h-full flex-col">
                    {res.image ? (
                      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-white/5">
                        <Image src={res.image} alt={res.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      </div>
                    ) : (
                      <div className="flex aspect-[16/10] w-full items-center justify-center border-b border-white/5 bg-zinc-900/50">
                        <span className="font-serif text-4xl italic text-gold/20">Vault</span>
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-8">
                      <h2 className="font-serif text-2xl font-semibold text-cream transition-colors duration-300 group-hover:text-gold mb-2">
                        {res.title}
                      </h2>
                      {res.description && <p className="mb-6 line-clamp-2 text-sm text-gray-500">{res.description}</p>}
                      <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-6">
                        <div className="text-[10px] font-mono text-gray-600">
                          {res.date && new Date(res.date).toLocaleDateString("en-GB")}
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/20 bg-gold/5 text-gold">
                          <ArrowRightIcon />
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-32 text-center text-gray-500 italic">Initializing Archive...</div>
          )}
        </section>
      </main>
    </Layout>
  );
};

const ArrowRightIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

export default ResourcesIndexPage;