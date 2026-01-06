import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Palette, ArrowRight } from "lucide-react";

import Layout from "@/components/Layout";
import {
  assertContentlayerHasDocs,
  getAllPrints,
  normalizeSlug,
  getDocHref,
  resolveDocCoverImage,
} from "@/lib/contentlayer";

type PrintItem = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  tags: string[];
  featured: boolean;
  date: string | null;
  href: string;
};

type Props = {
  prints: PrintItem[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  // CRITICAL FIX: Removed the argument to match function signature
  try {
    assertContentlayerHasDocs();
  } catch (e) {
    console.warn("Institutional Contentlayer check failed:", e);
  }

  const raw = getAllPrints();

  const prints: PrintItem[] = raw
    .map((p: any) => ({
      slug: normalizeSlug(p),
      title: p.title ?? "Untitled Print",
      excerpt: p.excerpt ?? p.description ?? null,
      coverImage: resolveDocCoverImage(p),
      tags: Array.isArray(p.tags) ? p.tags : [],
      featured: Boolean(p.featured),
      date: p.date ? String(p.date) : null,
      href: getDocHref(p),
    }))
    .sort((a, b) => {
      // Prioritize featured items, then sort by date (newest first)
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

  return { props: { prints }, revalidate: 1800 };
};

const PrintsIndexPage: NextPage<Props> = ({ prints }) => {
  const pageTitle = "Visual Artefacts";
  const pageDescription =
    "Typography, posters, and statements. Designed like heirlooms to anchor the physical space with strategic truth.";

  return (
    <Layout title={pageTitle} description={pageDescription}>
      <Head>
        <title>{pageTitle} | Abraham of London</title>
      </Head>

      <main className="min-h-screen bg-black">
        <section className="relative border-b border-gold/10 bg-gradient-to-b from-black to-zinc-950/50">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
                <Palette className="h-3.5 w-3.5" />
                Visual Artefacts
              </div>
              <h1 className="font-serif text-4xl font-semibold text-cream sm:text-5xl lg:text-6xl">
                Prints
              </h1>
              <p className="mt-6 text-base leading-relaxed text-gray-400 sm:text-lg">
                {pageDescription}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-24">
          {prints.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] py-24 text-center">
              <p className="font-serif text-xl italic text-gray-500">
                The gallery is currently being curated.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {prints.map((p) => (
                <Link
                  key={p.slug}
                  href={p.href}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/30 transition-all duration-500 hover:border-gold/30 hover:bg-zinc-900/50"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-black/40">
                    <Image
                      src={p.coverImage || "/assets/images/writing-desk.webp"}
                      alt={p.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                    <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:opacity-0" />
                    {p.featured && (
                      <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-black/60 backdrop-blur-md px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-gold shadow-2xl">
                        <Sparkles className="h-3 w-3" /> Featured
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-serif text-xl font-semibold text-cream transition-colors duration-300 group-hover:text-gold">
                      {p.title}
                    </h2>
                    {p.excerpt && (
                      <p className="mt-3 text-sm leading-relaxed text-gray-400 line-clamp-2">
                        {p.excerpt}
                      </p>
                    )}
                    <div className="mt-auto pt-6">
                      <div className="flex items-center justify-between border-t border-white/5 pt-4">
                        <div className="flex flex-wrap gap-2">
                          {p.tags.slice(0, 2).map((t) => (
                            <span key={t} className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                              #{t}
                            </span>
                          ))}
                        </div>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/20 bg-gold/5 text-gold transition-all duration-300 group-hover:bg-gold group-hover:text-black">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

export default PrintsIndexPage;

