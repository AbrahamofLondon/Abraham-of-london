// pages/blog/index.tsx
import * as React from "react";
import type {
  GetStaticProps,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import Layout from "@/components/Layout";

// Centralised Contentlayer access
import {
  allPosts,
  getPublishedDocuments,
  type PostDocument as Post,
} from "@/lib/contentlayer-helper";

// Use the correct import from BlogPostCard
import { BlogPostCard } from "@/components/BlogPostCard";

type Props = {
  posts: Post[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const posts = getPublishedDocuments(allPosts as Post[]);

  return {
    props: {
      posts,
    },
    revalidate: 3600, // 1 hour
  };
};

const BlogIndexPage: NextPage<
  InferGetStaticPropsType<typeof getStaticProps>
> = ({ posts }) => {
  return (
    <Layout title="Blog">
      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-8 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Canon · Commentary
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            Blog & Essays
          </h1>
          <p className="text-sm text-gray-300">
            Long-form thinking on purpose, governance, fatherhood and the
            builder’s life.
          </p>
        </header>

        {(!posts || posts.length === 0) && (
          <p className="text-sm text-gray-400">
            No posts are published yet. The Canon is still loading.
          </p>
        )}

        {posts && posts.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <BlogPostCard
                // We know your Contentlayer IDs are stable
                key={post._id}
                // Cast at the boundary so we don’t guess the internal props shape
                post={post as any}
              />
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
};

export default BlogIndexPage;