// pages/blog/index.tsx
import * as React from "react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import Layout from "@/components/Layout";
import { getPostSlugs, getPostBySlug } from "@/lib/server/posts-data";

// -----------------------------------------------------------------------------
// Types & helpers
// -----------------------------------------------------------------------------

interface BlogListItem {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string | null;
  date: string | null;
  author: string | null;
  readTime: string | null;
}

interface BlogIndexProps {
  posts: BlogListItem[];
}

function cleanSlug(raw: string): string {
  return raw
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^blog\//i, "");
}

function normaliseDate(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  if (raw instanceof Date) return raw.toISOString();

  try {
    const d = new Date(raw as string | number);
    if (!Number.isNaN(d.valueOf())) return d.toISOString();
  } catch {
    // ignore
  }
  return null;
}

function formatPrettyDate(input: string | null | undefined): string | null {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.valueOf())) return input;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

function BlogIndexPage({ posts }: BlogIndexProps) {
  const hasPosts = Array.isArray(posts) && posts.length > 0;

  return (
    <Layout title="Insights">
      <Head>
        <title>Blog &amp; Insights | Abraham of London</title>
        <meta
          name="description"
          content="Long-form field notes on fatherhood, leadership, faith, and strategy — written from courtrooms, boardrooms, and the quiet in-between."
        />
        <link rel="canonical" href="https://www.abrahamoflondon.org/blog" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-charcoal to-black pt-20">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/8 via-transparent to-forest/10" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <header className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
                Blog &amp; Insights
              </p>
              <h1 className="mt-4 font-serif text-4xl font-semibold text-cream sm:text-5xl lg:text-6xl">
                Field notes for{" "}
                <span className="block bg-gradient-to-r from-gold to-amber-200 bg-clip-text text-transparent">
                  fathers, founders, and watchmen.
                </span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-gold/70 sm:text-xl">
                Essays and reflections forged in real decisions — not
                theory. Read if you&apos;re serious about legacy, not
                noise.
              </p>
            </header>
          </div>
        </section>

        {/* LIST */}
        <section className="pb-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            {!hasPosts && (
              <div className="mt-12 rounded-2xl border border-gold/30 bg-charcoal/60 p-8 text-center text-gold/70">
                <p className="text-lg">
                  The writing desk is warm, but this shelf is still being
                  stocked. First essays will land here shortly.
                </p>
              </div>
            )}

            {hasPosts && (
              <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => {
                  const prettyDate = formatPrettyDate(post.date);
                  const href = `/blog/${encodeURIComponent(post.slug)}`;
                  const cover =
                    post.coverImage && post.coverImage.trim().length > 0
                      ? post.coverImage
                      : "/assets/images/writing-desk.webp";

                  return (
                    <article
                      key={post.slug}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-gold/15 bg-charcoal/70 shadow-lg transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-2xl"
                    >
                      <div className="relative h-56 w-full overflow-hidden">
                        <Image
                          src={cover}
                          alt={post.title || "Article cover"}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        {prettyDate && (
                          <div className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-gold/80 backdrop-blur">
                            {prettyDate}
                          </div>
                        )}
                        {post.category && (
                          <div className="absolute bottom-4 left-4 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-gold/80 backdrop-blur">
                            {post.category}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col px-6 py-5">
                        <h2 className="font-serif text-xl font-semibold text-cream">
                          <Link href={href} className="hover:text-gold">
                            {post.title}
                          </Link>
                        </h2>

                        {post.excerpt && (
                          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gold/70">
                            {post.excerpt}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gold/60">
                          {post.author && (
                            <span className="rounded-full border border-gold/25 px-3 py-1">
                              {post.author}
                            </span>
                          )}
                          {post.readTime && (
                            <span className="rounded-full border border-gold/15 px-3 py-1">
                              {post.readTime}
                            </span>
                          )}
                        </div>

                        <div className="mt-6 flex items-center justify-between text-sm">
                          <Link
                            href={href}
                            className="inline-flex items-center gap-2 text-gold transition-colors hover:text-amber-200"
                          >
                            Read article
                            <span aria-hidden>↗</span>
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
}

// -----------------------------------------------------------------------------
// SSG
// -----------------------------------------------------------------------------

export const getStaticProps: GetStaticProps<BlogIndexProps> = async () => {
  try {
    const slugs = getPostSlugs?.() ?? [];

    const items: BlogListItem[] = [];

    for (const raw of slugs) {
      const cleaned = cleanSlug(String(raw));
      if (!cleaned) continue;

      // Try bare slug, then "blog/slug" as fallback – same pattern as [slug].tsx
      const baseFields = [
        "slug",
        "title",
        "description",
        "excerpt",
        "coverImage",
        "heroImage",
        "date",
        "author",
        "category",
        "readTime",
      ] as const;

      let data =
        getPostBySlug(cleaned, baseFields as unknown as string[]) || null;

      if (!data || !data.title) {
        data =
          getPostBySlug(
            `blog/${cleaned}`,
            baseFields as unknown as string[],
          ) || null;
      }

      if (!data || !data.title) continue;

      const jsonSafe = JSON.parse(JSON.stringify(data)) as {
        slug?: string;
        title?: string;
        description?: string;
        excerpt?: string;
        coverImage?: string;
        heroImage?: string;
        date?: string | Date;
        author?: string;
        category?: string;
        readTime?: string;
      };

      const dateIso = normaliseDate(jsonSafe.date);

      items.push({
        slug: cleaned,
        title: jsonSafe.title || cleaned,
        excerpt:
          jsonSafe.excerpt ||
          jsonSafe.description ||
          null,
        coverImage:
          jsonSafe.coverImage ||
          jsonSafe.heroImage ||
          null,
        category: jsonSafe.category || null,
        date: dateIso,
        author: jsonSafe.author || null,
        readTime: jsonSafe.readTime || null,
      });
    }

    // Sort newest first, but don't crash on missing dates
    items.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date > b.date ? -1 : a.date < b.date ? 1 : 0;
    });

    return {
      props: {
        posts: items,
      },
      revalidate: 3600,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in getStaticProps for /blog:", error);
    return {
      props: {
        posts: [],
      },
      revalidate: 600,
    };
  }
};

export default BlogIndexPage;