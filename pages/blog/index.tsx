// pages/blog/index.tsx
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import * as React from "react";

import Layout from "@/components/Layout";
import {
  getAllPostsMeta,
  type PostMeta,
} from "@/lib/server/posts-data";

type BlogIndexProps = {
  posts: PostMeta[];
};

function formatPretty(date?: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.valueOf())) return date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export const getStaticProps: GetStaticProps<BlogIndexProps> = async () => {
  const raw = getAllPostsMeta?.() ?? [];

  // JSON-safe clone to strip any non-serialisable fields
  const posts = JSON.parse(JSON.stringify(raw)) as PostMeta[];

  // only keep published posts
  const visible = posts.filter(
    (p) => (p as any).status !== "draft" && p.title,
  );

  return {
    props: {
      posts: visible,
    },
    revalidate: 3600,
  };
};

export default function BlogIndex({ posts }: BlogIndexProps) {
  const hasPosts = posts && posts.length > 0;

  return (
    <Layout title="Insights & Reflections">
      <Head>
        <title>Insights &amp; Reflections | Abraham of London</title>
        <meta
          name="description"
          content="Essays, reflections, and strategic insights for fathers, founders, and leaders building enduring legacies."
        />
      </Head>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-softGold">
            Blog
          </p>
          <h1 className="mb-4 font-serif text-3xl font-light text-white sm:text-4xl lg:text-5xl">
            Insights for Fathers, Founders &amp; Leaders
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-gray-300 sm:text-base">
            Long-form reflections on faith, fatherhood, leadership, and
            legacy—written for those who refuse to outsource their
            responsibility.
          </p>
        </header>

        {!hasPosts && (
          <div className="mt-16 rounded-2xl border border-white/10 bg-black/40 px-6 py-10 text-center text-gray-300">
            <p className="mb-2 text-lg">
              No essays are visible yet.
            </p>
            <p className="text-sm text-gray-400">
              The writing room isn&apos;t empty—just being curated. Check
              back soon or explore downloads and resources in the
              meantime.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/downloads"
                className="rounded-full bg-softGold px-6 py-2.5 text-sm font-medium text-deepCharcoal hover:bg-softGold/90"
              >
                Explore Downloads
              </Link>
              <Link
                href="/content"
                className="rounded-full border border-softGold px-6 py-2.5 text-sm font-medium text-softGold hover:bg-softGold/10"
              >
                View All Content
              </Link>
            </div>
          </div>
        )}

        {hasPosts && (
          <section className="grid gap-8 md:grid-cols-2">
            {posts.map((post) => {
              const href = `/blog/${post.slug}`;
              const cover =
                typeof post.coverImage === "string" &&
                post.coverImage.trim().length > 0
                  ? post.coverImage
                  : "/assets/images/writing-desk.webp";

              return (
                <article
                  key={post.slug}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-lg transition-all hover:-translate-y-1 hover:border-softGold/40 hover:shadow-2xl"
                >
                  <div className="relative h-56 w-full overflow-hidden">
                    <Image
                      src={cover}
                      alt={post.title || "Post cover"}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(min-width: 1024px) 50vw, 100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-3 flex items-center justify-between gap-3 text-xs text-gray-400">
                      <span className="rounded-full border border-softGold/30 bg-softGold/10 px-3 py-1 uppercase tracking-[0.18em] text-softGold">
                        {post.category || "Reflection"}
                      </span>
                      {post.date && (
                        <time
                          dateTime={post.date}
                          className="text-[11px] uppercase tracking-[0.18em]"
                        >
                          {formatPretty(post.date)}
                        </time>
                      )}
                    </div>

                    <h2 className="mb-3 font-serif text-xl font-light text-white group-hover:text-softGold">
                      <Link href={href}>{post.title}</Link>
                    </h2>

                    {post.excerpt && (
                      <p className="mb-4 line-clamp-3 text-sm text-gray-300">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-2 text-xs text-gray-400">
                      <span>
                        {post.author || "Abraham of London"}
                      </span>
                      {post.readTime && (
                        <span>{post.readTime}</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </Layout>
  );
}