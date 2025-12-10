// pages/founders/index.tsx
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";
import { BlogPostCard } from "@/components/Cards";
import {
  getPublishedPosts,
  getAllStrategies,
} from "@/lib/contentlayer-helper";
import type { Post, Strategy } from "contentlayer/generated";

type FoundersPageProps = {
  posts: Post[];
  strategies: Strategy[];
};

function hasTagLike(doc: { tags?: string[] }, needles: string[]): boolean {
  const tags = (doc.tags || []).map((t) => t.toLowerCase());
  return needles.some((needle) =>
    tags.some((t) => t.includes(needle.toLowerCase())),
  );
}

export const getStaticProps: GetStaticProps<FoundersPageProps> = async () => {
  const posts = getPublishedPosts().filter((p) =>
    hasTagLike(p, ["founder", "startup", "venture"]),
  );
  const strategies = getAllStrategies().filter((s) =>
    hasTagLike(s, ["founder", "startup", "venture", "strategy"]),
  );

  return {
    props: { posts, strategies },
    revalidate: 3600,
  };
};

const FoundersPage: NextPage<FoundersPageProps> = ({
  posts,
  strategies,
}) => {
  return (
    <Layout
      title="Founder Tools"
      description="Strategic tools, playbooks, and lenses for founders who want to build with conscience and competence."
    >
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <header className="mb-10 space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-500">
            Founders · Tools
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-cream">
            Building companies that can look God in the eye
          </h1>
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-gray-200">
            Not hustle porn. Operating systems for founders who want to build
            ventures that can stand scrutiny — spiritual, ethical, and
            financial.
          </p>
        </header>

        {/* Strategy docs */}
        <section className="mb-12 space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-xl sm:text-2xl text-cream">
              Strategy playbooks &amp; lenses
            </h2>
            <Link
              href="/content"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400 underline-offset-4 hover:underline"
            >
              Content library ↠
            </Link>
          </div>
          {strategies.length === 0 ? (
            <p className="text-sm text-gray-400">
              Strategy blueprints for founders will appear here as they’re
              finalized.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {strategies.map((s) => (
                <article
                  key={s._id}
                  className="rounded-xl border border-gold/20 bg-night/60 p-4 shadow-sm"
                >
                  <h3 className="font-serif text-lg text-cream">
                    <Link href={s.url ?? `/strategies/${s.slug}`}>
                      {s.title}
                    </Link>
                  </h3>
                  {s.excerpt && (
                    <p className="mt-2 text-sm text-gray-300 line-clamp-3">
                      {s.excerpt}
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
              Essays for founders
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
              Founder-specific essays will appear here as they go live.
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

export default FoundersPage;