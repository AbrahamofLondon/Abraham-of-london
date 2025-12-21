// pages/blog/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";

import {
  assertContentlayerHasDocs,
  getPublishedPosts,
  getPostBySlug,
  normalizeSlug,
} from "@/lib/contentlayer-helper";

type Props = {
  post: {
    title: string;
    excerpt: string | null;
    author: string | null;
    coverImage: string | null;
    date: string | null;
    slug: string;
  };
  source: MDXRemoteSerializeResult;
};

const SITE = "https://www.abrahamoflondon.org";

export const getStaticPaths: GetStaticPaths = async () => {
  assertContentlayerHasDocs("pages/blog/[slug].tsx getStaticPaths");

  const posts = getPublishedPosts();

  const paths = posts
    .map((p: any) => {
      const slug = normalizeSlug(p);
      if (!slug) return null;
      return { params: { slug } };
    })
    .filter(Boolean) as { params: { slug: string } }[];

  console.log(`🧱 Blog: getStaticPaths -> ${paths.length} paths`);
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  assertContentlayerHasDocs("pages/blog/[slug].tsx getStaticProps");

  const slugParam = typeof params?.slug === "string" ? params.slug : "";
  if (!slugParam) return { notFound: true };

  // normalizeSlug() expects a doc; here we already have the slug string.
  // getPostBySlug() should accept canonical slugs; if yours doesn’t, we’ll
  // still catch it because normalizeSlug was used to build the paths.
  const doc = getPostBySlug(slugParam);

  if (!doc) {
    console.warn(`⚠️ Blog: notFound for slug=${slugParam}`);
    return { notFound: true };
  }

  const canonicalSlug = normalizeSlug(doc) || slugParam;

  const post = {
    title: doc.title || "Insight",
    excerpt: doc.excerpt || doc.description || null,
    author: doc.author || null,
    coverImage: doc.coverImage || null,
    date: doc.date ? new Date(doc.date).toISOString() : null,
    slug: canonicalSlug,
  };

  const raw = String(doc?.body?.raw ?? "");
  let source: MDXRemoteSerializeResult;

  try {
    source = await serialize(raw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
      },
    });
  } catch (err) {
    console.error(`❌ Blog: MDX serialize failed for ${canonicalSlug}`, err);
    source = await serialize("Content is being prepared.");
  }

  return {
    props: { post, source },
    revalidate: 3600,
  };
};

const PostPage: NextPage<Props> = ({ post, source }) => {
  const canonicalUrl = `${SITE}/blog/${post.slug}`;

  return (
    <Layout
      title={post.title}
      description={post.excerpt || undefined}
      ogImage={post.coverImage || undefined}
      ogType="article"
      canonicalUrl={canonicalUrl}
    >
      <Head>
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      <main className="mx-auto max-w-3xl px-6 py-12 lg:py-24">
        <Link href="/blog" className="text-sm text-gold hover:underline">
          ← Back to Essays
        </Link>

        <header className="mt-6 mb-10 border-b border-gold/10 pb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
            Insight &amp; Reflection
          </p>

          <h1 className="mt-4 font-serif text-3xl font-semibold text-cream sm:text-5xl">
            {post.title}
          </h1>

          {post.excerpt ? <p className="mt-4 text-gray-300">{post.excerpt}</p> : null}

          <div className="mt-4 flex gap-4 text-sm text-gray-400">
            {post.author ? <span>{post.author}</span> : null}
            {post.date ? (
              <span>
                {new Date(post.date).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            ) : null}
          </div>
        </header>

        <article className="prose prose-invert prose-gold max-w-none">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default PostPage;