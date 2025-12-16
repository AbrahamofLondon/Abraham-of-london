// pages/prints/index.tsx
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
  resolveDocCoverImage,
} from "@/lib/contentlayer-helper";

type PrintItem = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  tags: string[];
  featured: boolean;
  date: string | null;
};

type Props = {
  prints: PrintItem[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  assertContentlayerHasDocs("pages/prints/index.tsx getStaticProps");

  const raw = getAllPrints();

  const prints: PrintItem[] = raw
    .map((p: any) => ({
      slug: normalizeSlug(p),
      title: p.title ?? "Untitled Print",
      excerpt: p.excerpt ?? p.description ?? null,
      coverImage: resolveDocCoverImage(p) ?? null,
      tags: Array.isArray(p.tags) ? p.tags : [],
      featured: Boolean(p.featured),
      date: typeof p.date === "string" ? p.date : null,
    }))
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

  return { props: { prints }, revalidate: 3600 };
};

const PrintsIndexPage: NextPage<Props> = ({ prints }) => {
  const title = "Prints";
  const description =
    "Visual artefacts — typography, posters, statements. Designed like heirlooms, not social noise.";

  return (
    <Layout title={title} description={description} className="bg-charcoal">
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${title} | Abraham of London`} />
        <meta property="og:description" content={description} />
      </Head>

      <main className="min-h-screen">
        <section className="border-b border-white/10 bg-gradient-to-b from-black to-charcoal">
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
                <Palette className="h-4 w-4" />
                Prints · Visual Artefacts
              </div>
              <h1 className="font-serif text-4xl font-semibold text-cream sm:text-5xl">
                Prints
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-white/70">
                {description}
              </p>
              <p className="mt-4 text-xs text-white/50">{prints.length} items</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
          {prints.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-10 text-center text-white/60">
              Prints are being prepared for release.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {prints.map((p) => (
                <Link
                  key={p.slug}
                  href={`/prints/${p.slug}`}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10"
                >
                  <div className="relative aspect-[3/4] bg-black/40">
                    <Image
                      src={p.coverImage || "/assets/images/writing-desk.webp"}
                      alt={p.title}
                      fill
                      className="object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                      sizes="(min-width: 1024px) 30vw, 100vw"
                    />
                    {p.featured && (
                      <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200">
                        <Sparkles className="h-3 w-3" /> Featured
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h2 className="font-serif text-lg font-semibold text-cream line-clamp-2">
                      {p.title}
                    </h2>
                    {p.excerpt ? (
                      <p className="mt-2 text-sm text-white/65 line-clamp-2">
                        {p.excerpt}
                      </p>
                    ) : null}

                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/50">
                      <div className="flex flex-wrap gap-2">
                        {p.tags.slice(0, 2).map((t) => (
                          <span key={t} className="rounded-full bg-white/5 px-2 py-0.5">
                            #{t}
                          </span>
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 text-amber-200">
                        Open <ArrowRight className="h-3 w-3" />
                      </span>
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