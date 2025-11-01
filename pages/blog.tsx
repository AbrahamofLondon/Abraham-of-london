// pages/blog.tsx
import { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import BlogPostCard from "@/components/BlogPostCard";
import { getAllContent } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";

type BlogProps = InferGetStaticPropsType<typeof getStaticProps>;

export const getStaticProps: GetStaticProps = async () => {
  const allPosts = getAllContent('blog');
  const posts = allPosts.map(post => JSON.parse(JSON.stringify(post)));

  return {
    props: { posts },
    revalidate: 3600,
  };
};

export default function Blog({ posts }: BlogProps) {
  return (
    <Layout pageTitle="Insights">
      <Head>
        <title>Insights | Abraham of London</title>
        <meta name="description" content="Principled strategy, writing, and ventures from Abraham of London." />
      </Head>
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-serif font-bold text-center mb-10">
          Insights
        </h1>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* ✅ FIX: This now maps over your posts and renders the full card */}
          {posts.map((post) => (
            <BlogPostCard key={post.slug} {...post} />
          ))}
        </div>
      </main>
    </Layout>
  );
}