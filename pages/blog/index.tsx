/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/blog/index.tsx — ESSAYS ARCHIVE (Premium hero, stable banner, no title shove) */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";

import Layout from "@/components/Layout";
import { Search, ArrowRight, Tag } from "lucide-react";

import { getPublishedPosts } from "@/lib/content/server";
import { normalizeSlug, joinHref } from "@/lib/content/shared";
import { resolveDocCoverImage, sanitizeData } from "@/lib/content/client-utils";

type BlogPost = {
  slug: string;
  url: string;
  title: string;
  excerpt: string | null;
  date: string | null;
  dateIso: string | null;
  readTime: string | null;
  coverImage: string | null;
  tags: string[];
  author: string | null;
  featured?: boolean;
};

type BlogIndexProps = {
  items: BlogPost[];
  totalPosts: number;
};

const HEADER_HEIGHT = 80; // your Header is h-20

const BlogIndex: NextPage<BlogIndexProps> = ({ items, totalPosts }) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);

  const allTags = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const p of items) for (const t of p.tags || []) map.set(t, (map.get(t) || 0) + 1);
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14)
      .map(([t]) => t);
  }, [items]);

  const filteredPosts = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((post) => {
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        (post.excerpt || "").toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q));

      const matchesTag = !selectedTag || post.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [items, searchQuery, selectedTag]);

  const heroImage =
    items.find((p) => p.coverImage)?.coverImage || "/assets/images/blog/default-blog-cover.jpg";

  return (
    <Layout
      title="Essays // Abraham of London"
      canonicalUrl="/blog"
      className="bg-black text-white"
      fullWidth
      headerTransparent={false}
    >
      <Head>
        <title>Essays // Abraham of London</title>
      </Head>

      {/* HERO */}
      <section
        className="relative overflow-hidden border-b border-white/10"
        style={{ paddingTop: HEADER_HEIGHT }}
      >
        {/* Banner: stable aspect; doesn’t crush title */}
        <div className="relative mx-auto max-w-7xl px-6 lg:px-12 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Title block */}
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/60">
                  Essays & Insights
                </span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">
                  {totalPosts} notes
                </span>
              </div>

              <h1 className="mt-6 font-serif text-4xl md:text-5xl tracking-tight text-white/95">
                Essays &amp; Insights
              </h1>
              <p className="mt-3 max-w-xl text-sm md:text-base text-white/50 leading-relaxed">
                Explorations in the craft of building meaningful institutions.
              </p>

              {/* Search */}
              <div className="mt-8">
                <div className="relative max-w-xl">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                  <input
                    type="text"
                    placeholder="Search essays, tags, themes…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white/85 placeholder:text-white/20 outline-none focus:border-amber-500/25 focus:bg-white/[0.05]"
                  />
                </div>

                {/* Tag chips */}
                {allTags.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTag(null)}
                      className={[
                        "inline-flex items-center gap-2 rounded-full px-4 py-2 border text-[10px] font-mono uppercase tracking-[0.25em] transition-all",
                        !selectedTag
                          ? "border-amber-500/25 bg-amber-500/10 text-amber-100"
                          : "border-white/10 bg-white/[0.02] text-white/45 hover:text-white/70 hover:bg-white/[0.04]",
                      ].join(" ")}
                    >
                      <Tag className="h-3.5 w-3.5" />
                      All
                    </button>

                    {allTags.map((t) => {
                      const active = selectedTag === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSelectedTag(active ? null : t)}
                          className={[
                            "rounded-full px-4 py-2 border text-[10px] font-mono uppercase tracking-[0.25em] transition-all",
                            active
                              ? "border-amber-500/25 bg-amber-500/10 text-amber-100"
                              : "border-white/10 bg-white/[0.02] text-white/45 hover:text-white/70 hover:bg-white/[0.04]",
                          ].join(" ")}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Banner image */}
            <div className="lg:col-span-7">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
                {/* Stable aspect ratio box */}
                <div className="relative w-full" style={{ aspectRatio: "21 / 9" }}>
                  <Image
                    src={heroImage}
                    alt="Essays banner"
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 900px"
                  />
                  {/* overlays */}
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-black/35" />
                  <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.18),transparent_55%)]" />
                </div>

                {/* Caption strip */}
                <div className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
                    Institutional thinking • published notes
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/55">
                    Read ↓
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIST */}
      <section className="mx-auto max-w-7xl px-6 lg:px-12 py-14">
        <div className="grid gap-8">
          {filteredPosts.map((post) => (
            <Link
              key={post.url}
              href={post.url}
              className="group block rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.03] transition-colors"
            >
              <article className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 md:p-7">
                {/* thumb */}
                <div className="md:col-span-4">
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                    <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                      <Image
                        src={post.coverImage || "/assets/images/blog/default-blog-cover.jpg"}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        sizes="(max-width: 768px) 100vw, 420px"
                      />
                      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    </div>
                  </div>
                </div>

                {/* meta */}
                <div className="md:col-span-8 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/60">
                      {post.date ? <span>{post.date}</span> : null}
                      {post.readTime ? <span className="text-white/35">{post.readTime}</span> : null}
                      {post.tags?.[0] ? <span className="text-white/25">{post.tags[0]}</span> : null}
                    </div>

                    <h2 className="mt-4 font-serif text-2xl md:text-3xl text-white/92 tracking-tight group-hover:text-amber-100 transition-colors">
                      {post.title}
                    </h2>

                    {post.excerpt ? (
                      <p className="mt-4 text-sm md:text-base text-white/50 leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-6 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/70">
                    Read essay
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </article>
            </Link>
          ))}

          {filteredPosts.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center">
              <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
                No matches
              </div>
              <div className="mt-3 text-white/70">
                Try a different keyword or clear the tag filter.
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<BlogIndexProps> = async () => {
  try {
    const allPosts = getPublishedPosts();

    const items: BlogPost[] = allPosts
      .map((doc: any) => {
        const raw = normalizeSlug(doc.slug || doc._raw?.flattenedPath || "");
        const bareSlug = raw.replace(/^blog\//, "");

        return {
          slug: bareSlug,
          url: joinHref("blog", bareSlug),
          title: doc.title || "Untitled Essay",
          excerpt: doc.excerpt || doc.description || null,
          date: doc.date ? new Date(doc.date).toLocaleDateString("en-GB") : null,
          dateIso: doc.date ? new Date(doc.date).toISOString() : null,
          readTime: doc.readTime || "5 min read",
          coverImage: resolveDocCoverImage(doc),
          tags: Array.isArray(doc.tags) ? doc.tags : [],
          author: doc.author || "Abraham of London",
          featured: !!doc.featured,
        };
      })
      .sort((a, b) => (b.dateIso || "").localeCompare(a.dateIso || ""));

    return {
      props: sanitizeData({
        items,
        totalPosts: items.length,
      }),
      revalidate: 3600,
    };
  } catch {
    return { props: { items: [], totalPosts: 0 }, revalidate: 60 };
  }
};

export default BlogIndex;