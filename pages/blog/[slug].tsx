/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote } from "next-mdx-remote";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import mdxComponents from "@/components/mdx-components";

// Internal Libs
import { getPostBySlug, getPublishedPosts } from "@/lib/content/server";
import { resolveDocCoverImage } from "@/lib/content/client-utils";
import { normalizeSlug } from "@/lib/content/shared";

interface BlogProps {
  post: {
    title: string;
    excerpt: string;
    date: string;
    slug: string;
    accessLevel: string;
    coverImage: string | null;
  };
  locked: boolean;
  initialSource: any;
  mdxRaw: string;
  jsonLd: any;
}

const BlogSlugPage: NextPage<BlogProps> = ({ post, locked, initialSource, mdxRaw, jsonLd }) => {
  const router = useRouter();
  const [source, setSource] = React.useState(initialSource);

  if (router.isFallback) return <div className="min-h-screen bg-black" />;

  return (
    <Layout 
      title={post.title} 
      description={post.excerpt} 
      structuredData={jsonLd}
    >
      <article className="max-w-3xl mx-auto px-6 py-20 lg:py-32">
        <header className="mb-16 border-b border-white/5 pb-12">
          <div className="flex items-center gap-4 mb-6">
             <span className="text-gold font-mono text-[10px] uppercase tracking-[0.3em]">Intelligence Report</span>
             <span className="h-[1px] w-8 bg-white/20" />
             <div className="text-white/40 uppercase tracking-widest text-[10px]">{post.date}</div>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-cream leading-tight mb-6">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-xl text-white/50 font-light italic leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </header>
        
        <main className="min-h-[40vh]">
          {locked && !source ? (
            <div className="py-12">
              <AccessGate 
                requiredTier={post.accessLevel} 
                onUnlocked={() => window.location.reload()} 
              />
            </div>
          ) : (
            source && (
              <div className="prose prose-invert prose-gold max-w-none">
                <MDXRemote {...source} components={mdxComponents as any} />
              </div>
            )
          )}
        </main>
      </article>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getPublishedPosts() || [];
  const paths = posts.map(p => ({
    params: { slug: normalizeSlug(p.slug || p._raw?.flattenedPath || "").replace(/^blog\//, "") }
  }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = String(params?.slug || "");
  const postRaw = getPostBySlug(slug);

  if (!postRaw || postRaw.draft) return { notFound: true };

  // 🛡️ THE DATA FIREBREAK
  // Strip all non-primitives from the 'post' object.
  const post = {
    title: String(postRaw.title || "Untitled"),
    excerpt: String(postRaw.excerpt || ""),
    date: String(postRaw.date || ""),
    slug: slug,
    accessLevel: String(postRaw.accessLevel || "public"),
    coverImage: resolveDocCoverImage(postRaw) || null,
  };

  const jsonLd = postRaw.structuredData ? JSON.parse(JSON.stringify(postRaw.structuredData)) : null;
  const mdxRaw = postRaw.body?.raw || "";
  const locked = post.accessLevel !== "public";

  let initialSource = null;
  if (!locked && mdxRaw.trim()) {
    initialSource = await serialize(mdxRaw, {
      mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] }
    });
  }

  return {
    props: {
      post,
      locked,
      initialSource,
      mdxRaw: locked ? "" : mdxRaw,
      jsonLd
    },
    revalidate: 3600
  };
};

// 💎 REQUIRED: The default export that was missing/mangled
export default BlogSlugPage;