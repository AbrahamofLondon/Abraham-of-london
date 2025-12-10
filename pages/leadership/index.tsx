// pages/leadership/index.tsx
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";
import { BlogPostCard } from "@/components/Cards";
import {
  getPublishedPosts,
  getAllCanons,
} from "@/lib/contentlayer-helper";
import type { Post, Canon } from "contentlayer/generated";

type LeadershipPageProps = {
  posts: Post[];
  canons: Canon[];
};

function hasTagLike(doc: { tags?: string[] }, needles: string[]): boolean {
  const tags = (doc.tags || []).map((t) => t.toLowerCase());
  return needles.some((needle) =>
    tags.some((t) => t.includes(needle.toLowerCase())),
  );
}

export const getStaticProps: GetStaticProps<LeadershipPageProps> = async () => {
  const posts = getPublishedPosts().filter((p) =>
    hasTagLike(p, ["leadership", "leader"]),
  );
  const canons = getAllCanons().filter((c) =>
    hasTagLike(c, ["leadership", "governance", "authority"]),
  );

  return {
    props: { posts, canons },
    revalidate: 3600,
  };
};

const LeadershipPage: NextPage<LeadershipPageProps> = ({
  posts,
  canons,
}) => {
  return (
    <Layout
      title="Leadership Resources"
      description="Leadership frameworks for men who steward people, capital, and institutions."
    >
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <header className="mb-10 space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-500">
            Leadership · Governance
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-cream">
            Leadership that survives headlines
          </h1>
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-gray-200">
            For men holding responsibility in boardrooms, congregations, or
            communities — this is a stream of material built for endurance, not
            hype.
          </p>
        </header>

        {/* Canon */}
        <section className="mb-12 space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-xl sm:text-2xl text-cream">
              Canon anchors
            </h2>
            <Link
              href="/canon"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400 underline-offset-4 hover:underline"
            >
              Enter the Canon ↠
            </Link>
          </div>
          {canons.length === 0 ? (
            <p className="text-sm text-gray-400">
              Leadership-related canon entries will surface here as they go
              live.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {canons.map((canon) => (
                <article
                  key={canon._id}
                  className="rounded-xl border border-gold/20 bg-night/60 p-4 shadow-sm"
                >
                  <h3 className="font-serif text-lg text-cream">
                    <Link href={`/canon/${canon.slug}`}>{canon.title}</Link>
                  </h3>
                  {canon.excerpt && (
                    <p className="mt-2 text-sm text-gray-300 line-clamp-3">
                      {canon.excerpt}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Essays */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-xl sm:text-2xl text-cream">
              Essays on leadership
            </h2>
            <Link
              href="/blog"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400 underline-offset-4 hover:underline"
            >
              All essays ↠
            </Link>
          </div>
          {posts.length === 0 ? (
            <p className="text-sm text-gray-400">
              Leadership essays will appear here as they are published.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogPostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

export default LeadershipPage;