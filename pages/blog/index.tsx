// pages/blog/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";

import Layout from "@/components/Layout";
import {
  assertContentlayerHasDocs,
  getPublishedPosts,
  normalizeSlug,
} from "@/lib/contentlayer-helper";

type Item = {
  slug: string;
  title: string;
  excerpt?: string | null;
  date?: string | null;
  readTime?: string | null;
  coverImage?: string | null;
  tags?: string[] | null;
};

type Props = { items: Item[] };

const BlogIndex: NextPage<Props> = ({ items }) => {
  return (
    <Layout title="Essays">
      <Head>
        <link rel="canonical" href="https://www.abrahamoflondon.org/blog" />
      </Head>

      <section className="py-10 sm:py-14">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-softGold/70">
            Essays · Abraham of London
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold text-neutral-950 dark:text-cream">
            Essays
          </h1>
          <p className="mt-3 max-w-2xl text-neutral-700 dark:text-cream/80">
            Field notes, convictions, and strategic clarity — written for builders who refuse drift.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {items.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group overflow-hidden rounded-2xl border border-black/10 bg-white/60 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-black/25"
            >
              <div className="relative aspect-[16/9] bg-black/5 dark:bg-white/5">
                <Image
                  src={p.coverImage || "/assets/images/writing-desk.webp"}
                  alt={p.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  sizes="(min-width: 1024px) 40vw, 100vw"
                />
              </div>

              <div className="p-5">
                <h2 className="font-serif text-xl font-semibold text-neutral-950 dark:text-cream">
                  {p.title}
                </h2>

                {p.excerpt ? (
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-700 dark:text-cream/80">
                    {p.excerpt}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-softGold/70">
                  {p.date ? (
                    <span>
                      {new Date(p.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  ) : null}
                  {p.readTime ? <span>• {p.readTime}</span> : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  assertContentlayerHasDocs("pages/blog/index.tsx getStaticProps");

  const published = getPublishedPosts();

  const items: Item[] = published
    .map((p: any) => ({
      slug: normalizeSlug(p),
      title: p.title ?? "Untitled",
      excerpt: p.excerpt ?? null,
      date: p.date ?? null,
      readTime: p.readTime ?? null,
      coverImage: p.coverImage ?? p.image ?? null,
      tags: Array.isArray(p.tags) ? p.tags : null,
    }))
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

  return { props: { items }, revalidate: 3600 };
};

export default BlogIndex;