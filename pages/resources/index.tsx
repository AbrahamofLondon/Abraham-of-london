// pages/resources/index.tsx
/* pages/resources/index.tsx — RESOURCE VAULT (INTEGRITY MODE) */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import Layout from "@/components/Layout";
import { getContentlayerData } from "@/lib/content/server";
import { normalizeSlug } from "@/lib/content/shared";
import { safeSlice } from "@/lib/utils/safe";

type ResourceMeta = {
  slug: string; // slug without "resources/"
  title: string;
  description: string | null;
  subtitle: string | null;
  date: string | null; // ISO
  readTime: string | null;
  image: string | null;
  tags: string[];
  author: string | null;
  href: string; // /resources/{slug}
};

type Props = { resources: ResourceMeta[] };

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

function resolveDocCoverImage(doc: any): string | null {
  return doc?.coverImage || doc?.featuredImage || doc?.image || doc?.thumbnail || null;
}

function resolveResourceSlug(doc: any): string {
  const raw = doc?.slugComputed || doc?.slug || doc?._raw?.flattenedPath || "";
  const n = normalizeSlug(String(raw || ""));
  return n.replace(/^resources\//, "");
}

function resolveResourceHref(slug: string): string {
  return `/resources/${slug}`;
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
        const slug = resolveResourceSlug(r);
        const title = String(r?.title || "").trim();

        return {
          slug,
          title: title || "Untitled Resource",
          description: r?.description ?? r?.excerpt ?? null,
          subtitle: r?.subtitle ?? null,
          date: safeDateISO(r?.date),
          readTime: r?.readTime ?? r?.normalizedReadTime ?? null,
          image: resolveDocCoverImage(r),
          tags: Array.isArray(r?.tags) ? r.tags.filter((x: any) => typeof x === "string" && x.trim()) : [],
          author: r?.author ?? null,
          href: resolveResourceHref(slug),
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
    // eslint-disable-next-line no-console
    console.error("Resource index getStaticProps failed:", error);
    return { props: { resources: [] }, revalidate: 1800 };
  }
};

const ResourcesIndexPage: NextPage<Props> = ({ resources }) => {
  const pageTitle = "The Resource Vault | Abraham of London";
  const pageDescription = "Structural assets, frameworks, and tools for fathers, founders, and institutional architects.";

  return (
    <Layout title="Resource Vault" description={pageDescription}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE}/resources`} />
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
              Curated frameworks and structural primers. Not general insights — architectural tools for those building legacies.
            </p>

            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-gold/30" />
              <p className="text-[11px] font-mono uppercase tracking-widest text-gold/60">{resources.length} Resources</p>
              <div className="h-px w-8 bg-gold/30" />
            </div>
          </header>

          {resources.length > 0 ? (
            <div className="grid gap-10 md:grid-cols-2">
              {resources.map((res) => (
                <article
                  key={res.slug}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] transition-all duration-500 hover:border-gold/30 hover:bg-white/[0.04]"
                >
                  <Link href={res.href} className="flex h-full flex-col">
                    {res.image ? (
                      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-white/5">
                        <Image
                          src={res.image}
                          alt={res.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20 transition-opacity group-hover:opacity-0" />
                      </div>
                    ) : (
                      <div className="flex aspect-[16/10] w-full items-center justify-center border-b border-white/5 bg-zinc-900/50">
                        <span className="font-serif text-4xl italic text-gold/20">Vault</span>
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-8">
                      <div className="mb-4">
                        <div className="mb-3 flex items-center gap-3">
                          <span className="rounded bg-gold/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-gold/80">
                            Resource
                          </span>
                          {res.readTime ? (
                            <span className="text-[10px] font-mono uppercase tracking-tighter text-gray-500">{res.readTime}</span>
                          ) : null}
                        </div>

                        <h2 className="font-serif text-2xl font-semibold text-cream transition-colors duration-300 group-hover:text-gold">
                          {res.title}
                        </h2>
                      </div>

                      {res.subtitle ? <p className="mb-4 text-sm font-medium italic text-gray-400">{res.subtitle}</p> : null}

                      {res.description ? (
                        <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-gray-500">{res.description}</p>
                      ) : null}

                      <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-6">
                        <div className="flex flex-col gap-0.5">
                          {res.author ? <span className="text-[10px] uppercase tracking-wide text-gray-400">By {res.author}</span> : null}
                          {res.date ? (
                            <time className="text-[10px] font-mono text-gray-600">
                              {new Date(res.date).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}
                            </time>
                          ) : null}
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/20 bg-gold/5 text-gold transition-all duration-300 group-hover:bg-gold group-hover:text-black">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </div>
                      </div>

                      {res.tags.length > 0 ? (
                        <div className="mt-6 flex flex-wrap gap-2">
                          {safeSlice(res.tags, 0, 6).map((t) => (
                            <span
                              key={t}
                              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-widest text-gray-400"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-32 text-center">
              <h3 className="font-serif text-2xl italic text-cream opacity-50">Resources are being initialized…</h3>
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

export default ResourcesIndexPage;