// pages/blog/index.tsx
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import { allPosts, type Post } from "@/lib/contentlayer-helper";

interface BlogPageProps {
  posts: Post[];
}

const BlogPage: NextPage<BlogPageProps> = ({ posts }) => {
  // Always work on a safe array
  const safePosts: Post[] = Array.isArray(posts) ? posts : [];

  // Derive unique tags for the filter
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    for (const post of safePosts) {
      if (Array.isArray(post.tags)) {
        for (const tag of post.tags) {
          if (typeof tag === "string" && tag.trim()) {
            tagSet.add(tag.trim());
          }
        }
      }
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [safePosts]);

  const [activeTag, setActiveTag] = React.useState<string>("all");

  const filteredPosts = React.useMemo(() => {
    if (activeTag === "all") return safePosts;
    return safePosts.filter((post) =>
      Array.isArray(post.tags) ? post.tags.includes(activeTag) : false
    );
  }, [safePosts, activeTag]);

  const hasPosts = safePosts.length > 0;

  // Pick a "hero" post (first in the sorted list)
  const heroPost = hasPosts ? safePosts[0] : null;
  const otherPosts = hasPosts ? safePosts.slice(1) : [];

  return (
    <Layout
      title="Blog"
      pageTitle="Blog"
      transparentHeader={false}
    >
      <Head>
        <title>Blog | Abraham of London</title>
        <meta
          name="description"
          content="Essays, canon excerpts, and strategic reflections from Abraham of London — on purpose, leadership, fatherhood, and legacy."
        />
      </Head>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14 lg:py-16">
        {/* HERO SECTION */}
        <section className="mb-10 space-y-5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-gold/70">
            Abraham of London · Canon · Essays
          </p>
          <h1 className="font-serif text-3xl font-light text-cream sm:text-4xl">
            The Writing Desk
          </h1>
          <p className="max-w-2xl text-sm text-gray-300">
            Long-form thinking for serious people — exploring purpose, governance,
            fatherhood, and the quiet architecture of a life that outlives headlines.
          </p>
        </section>

        {/* EMPTY STATE */}
        {!hasPosts && (
          <section className="rounded-2xl border border-dashed border-gold/30 bg-charcoal-light/40 p-8 text-center text-sm text-gray-200">
            <h2 className="mb-2 font-semibold text-cream">
              Essays are being prepared
            </h2>
            <p className="max-w-md mx-auto">
              The first wave of essays and canon excerpts is in final edit. Check back
              soon, or join the Inner Circle to be notified when new writing goes live.
            </p>
          </section>
        )}

        {hasPosts && (
          <div className="space-y-12">
            {/* HERO POST CARD */}
            {heroPost && (
              <section className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-stretch">
                <HeroPostCard post={heroPost} />

                {/* Tag filter panel */}
                <aside className="rounded-2xl border border-gold/25 bg-charcoal-light/40 p-5">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/70">
                    Filter by theme
                  </h2>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTag("all")}
                      className={[
                        "rounded-full border px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em] transition",
                        activeTag === "all"
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-gold/30 text-gray-300 hover:border-gold/60 hover:text-gold"
                      ].join(" ")}
                    >
                      All
                    </button>

                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setActiveTag(tag)}
                        className={[
                          "rounded-full border px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em] transition",
                          activeTag === tag
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-gold/30 text-gray-300 hover:border-gold/60 hover:text-gold"
                        ].join(" ")}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <p className="mt-4 text-[0.7rem] text-gray-400">
                    Showing{" "}
                    <span className="font-semibold text-gold">
                      {filteredPosts.length}
                    </span>{" "}
                    {activeTag === "all" ? "posts" : `“${activeTag}” posts`}.
                  </p>
                </aside>
              </section>
            )}

            {/* GRID OF POSTS (filtered, excluding hero) */}
            <section className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/60">
                Latest essays
              </h2>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPosts
                  .filter((post) => !heroPost || post._id !== heroPost._id)
                  .map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </Layout>
  );
};

type HeroPostCardProps = {
  post: Post;
};

const HeroPostCard: React.FC<HeroPostCardProps> = ({ post }) => {
  const { slug, title, excerpt, description, date, readTime, tags } = post;
  const href = `/${slug}`;
  const copy = description || excerpt || "";
  const displayTags = Array.isArray(tags) ? tags.slice(0, 3) : [];

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-charcoal-light/80 via-charcoal/90 to-black/90 p-6 sm:p-7">
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_top,_#f7e7ce_0,_transparent_55%)]" />
      <div className="relative z-10 flex flex-1 flex-col gap-4">
        <div className="space-y-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-gold/80">
            Featured essay
          </p>
          <h2 className="font-serif text-2xl font-light text-cream sm:text-3xl">
            {title}
          </h2>
        </div>

        {copy && (
          <p className="max-w-xl text-sm text-gray-200">
            {copy}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-3 text-[0.7rem] text-gray-300">
          {date && (
            <span>
              {new Date(date).toLocaleDateString("en-GB", {
                year: "numeric",
                month: "short",
                day: "2-digit",
              })}
            </span>
          )}

          {readTime && (
            <span className="rounded-full border border-gold/50 px-3 py-0.5 uppercase tracking-[0.18em] text-gold">
              {readTime}
            </span>
          )}

          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {displayTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-black/40 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.14em] text-gray-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <Link
            href={href}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold hover:text-gold-light"
          >
            Read essay
            <span aria-hidden>↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
};

type PostCardProps = {
  post: Post;
};

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { slug, title, excerpt, description, date, readTime, tags } = post;
  const href = `/${slug}`;
  const copy = description || excerpt || "";
  const displayTags = Array.isArray(tags) ? tags.slice(0, 2) : [];

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gold/20 bg-charcoal-light/60 p-5 transition hover:-translate-y-0.5 hover:border-gold/60 hover:bg-charcoal-light"
    >
      <div className="flex flex-1 flex-col gap-3">
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-light text-cream transition group-hover:text-gold">
            {title}
          </h3>
          {copy && (
            <p className="line-clamp-3 text-xs text-gray-300">
              {copy}
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 text-[0.7rem] text-gray-400">
          {date && (
            <span>
              {new Date(date).toLocaleDateString("en-GB", {
                year: "numeric",
                month: "short",
                day: "2-digit",
              })}
            </span>
          )}
          {readTime && (
            <span className="rounded-full border border-gold/40 px-2 py-0.5 uppercase tracking-[0.16em] text-gold/90">
              {readTime}
            </span>
          )}
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {displayTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-charcoal px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.12em] text-gray-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export const getStaticProps: GetStaticProps<BlogPageProps> = async () => {
  // Guard against contentlayer exports being undefined
  const postsSource = Array.isArray(allPosts) ? allPosts : [];

  const posts = postsSource
    .filter((post) => !post.draft)
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      if (db !== da) return db - da;
      return (a.title || "").localeCompare(b.title || "");
    });

  return {
    props: { posts },
    revalidate: 60, // 1 minute – matches your SSG cadence
  };
};

export default BlogPage;