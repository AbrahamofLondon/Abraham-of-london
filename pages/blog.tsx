import Head from "next/head";
import Layout from "@/components/Layout";
import BlogPostCard from "@/components/BlogPostCard";
import { getAllPosts } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";
import type { ReactElement } from "react";

type BlogProps = { posts: PostMeta[] };

export default function BlogPage({ posts }: BlogProps): ReactElement {
  return (
    <Layout pageTitle="Blog">
      <Head>
        <meta
          name="description"
          content="Featured insights from Abraham of London — principled strategy, fatherhood, and cultural commentary."
        />
      </Head>

      <section className="bg-warmWhite px-4 py-20">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <header className="mb-10 text-center">
            <h1 className="font-serif text-4xl font-bold text-deepCharcoal sm:text-5xl">
              Featured Insights
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-deepCharcoal/70">
              Essays, reflections, and commentary — crafted with clarity and
              standards that endure.
            </p>
            <div className="mx-auto mt-5 h-0.5 w-20 bg-softGold/60" />
          </header>

          {/* Filter bar (non-functional placeholder) */}
          <div className="mb-12 flex justify-center gap-4 text-sm">
            {["All", "Strategy", "Fatherhood", "Society"].map((cat) => (
              <button
                key={cat}
                className="rounded-full border border-lightGrey px-4 py-2 text-deepCharcoal transition hover:bg-white"
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Blog posts grid */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} {...post} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

// SSG
export async function getStaticProps() {
  const posts = getAllPosts();
  const safe = posts.map((p) => ({
    ...p,
    excerpt: p.excerpt ?? null,
    date: p.date ?? null,
    coverImage: p.coverImage ?? null,
    readTime: p.readTime ?? null, // This is the crucial fix
    category: p.category ?? null,
    author: p.author ?? null,
    tags: p.tags ?? null,
  }));
  return { props: { posts: safe } };
}