// pages/blog.tsx
/* eslint-disable react/no-unescaped-entities */
import React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { GetStaticProps } from "next";

import Layout from "@/components/Layout";
import { getAllPosts, PostMeta } from "@/lib/posts";

type Post = Required<
  Pick<
    PostMeta,
    "slug" | "title" | "date" | "excerpt" | "coverImage" | "author" | "readTime" | "category"
  >
>;

interface Props {
  posts: Post[];
}

const generatedCover = (slug: string) => `/assets/images/blog/${slug}.jpg`;

export const getStaticProps: GetStaticProps<Props> = async () => {
  const raw = getAllPosts([
    "slug",
    "title",
    "date",
    "publishedAt",
    "excerpt",
    "coverImage",
    "author",
    "readTime",
    "category",
  ]);

  const posts: Post[] = [...raw]
    .filter((p) => p && p.slug)
    .sort((a, b) => {
      const da = new Date((a.date || a.publishedAt || 0) as string).getTime();
      const db = new Date((b.date || b.publishedAt || 0) as string).getTime();
      return db - da;
    })
    .map((p, i) => ({
      slug: p.slug || `post-${i}`,
      title: p.title || "Untitled Post",
      date: (p.date || p.publishedAt || new Date().toISOString()) as string,
      excerpt: p.excerpt || "Discover insights and wisdom in this compelling read.",
      coverImage:
        typeof p.coverImage === "string" && p.coverImage.trim()
          ? p.coverImage
          : generatedCover(p.slug || `post-${i}`),
      author: p.author || "Abraham of London",
      readTime: p.readTime || "5 min read",
      category: p.category || "Insights",
    }));

  return { props: { posts }, revalidate: 1800 };
};

export default function BlogPage({ posts }: Props) {
  return (
    <Layout pageTitle="Blog">
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8 py-12">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-serif font-bold">Blog</h1>
          <p className="mt-2 text-deepCharcoal/70">
            Essays and field notes on leadership, fatherhood, and strategy.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-center text-deepCharcoal/70">No posts yet.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <article
                key={p.slug}
                className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/10 shadow-md hover:shadow-lg transition"
              >
                <Link href={`/blog/${p.slug}`} className="block">
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src={p.coverImage}
                      alt={p.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                      quality={90}
                      priority={false}
                    />
                  </div>
                  <div className="p-5">
                    <div className="text-xs uppercase tracking-wide text-forest/80">
                      {p.category}
                    </div>
                    <h2 className="mt-1 text-xl font-semibold text-deepCharcoal">
                      {p.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm text-deepCharcoal/80">
                      {p.excerpt}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-deepCharcoal/60">
                      <time dateTime={p.date}>
                        {new Date(p.date).toLocaleDateString()}
                      </time>
                      <span>{p.readTime}</span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
