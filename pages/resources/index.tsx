// pages/resources/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import Layout from "@/components/Layout";
import {
  assertContentlayerHasDocs,
  getAllResources,
  getDocHref,
  normalizeSlug,
  resolveDocCoverImage,
} from "@/lib/contentlayer";

type ResourceMeta = {
  slug: string;
  title: string;
  description?: string | null;
  subtitle?: string | null;
  date?: string | null;
  readTime?: string | null;
  image?: string | null;
  tags?: string[] | null;
  author?: string | null;
  href: string;
};

type Props = { resources: ResourceMeta[] };

const ResourcesIndexPage: NextPage<Props> = ({ resources }) => {
  const pageTitle = "The Resource Vault | Abraham of London";
  const pageDescription =
    "Structural assets, frameworks, and tools for fathers, founders, and institutional architects.";

  return (
    <Layout title="Resource Vault" description={pageDescription}>
      <Head>
        <title>{pageTitle}</title>
      </Head>

      <main className="min-h-screen bg-black text-cream">
        <section className="mx-auto max-w-5xl px-6 py-16 lg:py-24">
          <header className="mb-16 border-b border-gold/10 pb-12 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
                Strategic Assets
              </span>
            </div>

            <h1 className="font-serif text-4xl font-semibold tracking-tight text-cream sm:text-5xl lg:text-6xl">
              The Resource Vault
            </h1>

            <p className="mt-6 mx-auto max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg">
              Curated frameworks and structural primers. These are not general insights,
              but architectural tools for those building legacies.
            </p>

            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-gold/30" />
              <p className="text-[11px] font-mono uppercase tracking-widest text-gold/60">
                {resources.length} Compiled Volumes
              </p>
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
                            Framework
                          </span>
                          {res.readTime && (
                            <span className="text-[10px] font-mono uppercase tracking-tighter text-gray-500">
                              {res.readTime}
                            </span>
                          )}
                        </div>

                        <h2 className="font-serif text-2xl font-semibold text-cream transition-colors duration-300 group-hover:text-gold">
                          {res.title}
                        </h2>
                      </div>

                      {res.subtitle && (
                        <p className="mb-4 text-sm font-medium italic text-gray-400">
                          {res.subtitle}
                        </p>
                      )}

                      {res.description && (
                        <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-gray-500">
                          {res.description}
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-6">
                        <div className="flex flex-col gap-0.5">
                          {res.author && (
                            <span className="text-[10px] uppercase tracking-wide text-gray-400">
                              By {res.author}
                            </span>
                          )}
                          {res.date && (
                            <time className="text-[10px] font-mono text-gray-600">
                              {new Date(res.date).toLocaleDateString("en-GB", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </time>
                          )}
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/20 bg-gold/5 text-gold transition-all duration-300 group-hover:bg-gold group-hover:text-black">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-32 text-center">
              <h3 className="font-serif text-2xl italic text-cream opacity-50">
                Resources are being initialized...
              </h3>
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  // FIXED: Removed argument to resolve Type error
  assertContentlayerHasDocs();

  const docs = getAllResources();

  const resources: ResourceMeta[] = docs
    .map((r: any) => ({
      slug: normalizeSlug(r),
      title: r.title ?? "Untitled Resource",
      description: r.description ?? r.excerpt ?? null,
      subtitle: r.subtitle ?? null,
      date: r.date ? String(r.date) : null,
      readTime: r.normalizedReadTime ?? r.readTime ?? r.readtime ?? null,
      image: resolveDocCoverImage(r),
      tags: Array.isArray(r.tags) ? r.tags : null,
      author: r.author ?? null,
      href: getDocHref(r),
    }))
    .sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0));

  return { props: { resources }, revalidate: 1800 };
};

export default ResourcesIndexPage;

