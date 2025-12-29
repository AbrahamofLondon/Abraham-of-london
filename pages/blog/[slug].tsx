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
import { getPublishedPosts } from "@/lib/contentlayer-helper";

type Props = {
  post: {
    title: string;
    excerpt: string | null;
    author: string | null;
    coverImage: string | null;
    date: string | null; // ISO
    slug: string;
    url: string; // canonical /blog/<slug>
  };
  source: MDXRemoteSerializeResult;
};

const SITE =
  (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

function cleanPath(input: unknown): string {
  let s = String(input ?? "").trim();
  if (!s) return "";
  s = s.split("#")[0]?.split("?")[0] ?? s;
  s = s.replace(/^https?:\/\/[^/]+/i, "");
  s = s.replace(/\/+$/, "");
  s = s.replace(/^\/+/, "");
  return s;
}

function lastSegment(input: unknown): string {
  const s = cleanPath(input).toLowerCase();
  if (!s) return "";
  const parts = s.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : s;
}

/**
 * MDX hardening:
 * Replace unknown Capitalized JSX tags with <div>.
 * Prevents build failures when MDX uses components not registered in mdxComponents.
 */
function sanitizeBlogMdx(raw: string): string {
  if (!raw) return raw;

  // <MyComponent ... />
  raw = raw.replace(/<([A-Z][A-Za-z0-9_]*)\b[^>]*\/>/g, "<div />");

  // <MyComponent ...>
  raw = raw.replace(/<([A-Z][A-Za-z0-9_]*)\b[^>]*>/g, "<div>");

  // </MyComponent>
  raw = raw.replace(/<\/([A-Z][A-Za-z0-9_]*)\s*>/g, "</div>");

  return raw;
}

function deriveCanonical(doc: any): { slug: string; url: string } {
  const fromUrl = lastSegment(doc?.url);
  const fromSlug = lastSegment(doc?.slug);
  const fromPath = lastSegment(doc?._raw?.flattenedPath);
  const slug = fromUrl || fromSlug || fromPath;
  return { slug, url: slug ? `/blog/${slug}` : "/blog" };
}

function findPostBySlug(requestedSlug: string, posts: any[]) {
  const target = requestedSlug.toLowerCase();

  return (
    posts.find((p) => lastSegment(p?.url).toLowerCase() === target) ||
    posts.find((p) => lastSegment(p?.slug).toLowerCase() === target) ||
    posts.find((p) => lastSegment(p?._raw?.flattenedPath).toLowerCase() === target) ||
    posts.find((p) => cleanPath(p?.url).toLowerCase() === `blog/${target}`) ||
    null
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getPublishedPosts();

  const paths = posts
    .map((p: any) => deriveCanonical(p).slug)
    .filter(Boolean)
    .map((slug: string) => ({ params: { slug } }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const requestedSlug = lastSegment(params?.slug);
  if (!requestedSlug) return { notFound: true };

  const posts = getPublishedPosts();
  const rawDoc = findPostBySlug(requestedSlug, posts);
  if (!rawDoc) return { notFound: true };

  const { slug, url } = deriveCanonical(rawDoc);

  const post = {
    title: rawDoc?.title || "Insight",
    excerpt: rawDoc?.excerpt || rawDoc?.description || null,
    author: rawDoc?.author || null,
    coverImage: rawDoc?.coverImage || null,
    date: rawDoc?.date ? new Date(rawDoc.date).toISOString() : null,
    slug: slug || requestedSlug,
    url,
  };

  const raw = typeof rawDoc?.body?.raw === "string" ? rawDoc.body.raw : "";
  const safeRaw = sanitizeBlogMdx(raw);

  let source: MDXRemoteSerializeResult;
  try {
    source = await serialize(safeRaw || " ", {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
      },
    });
  } catch {
    source = await serialize("Content is being prepared.");
  }

  return { props: { post, source }, revalidate: 1800 };
};

const PostPage: NextPage<Props> = ({ post, source }) => {
  const canonicalUrl = `${SITE}${post.url}`;

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
        <title>{post.title} | Blog | Abraham of London</title>
      </Head>

      <main className="mx-auto max-w-3xl px-6 py-12 lg:py-24">
        <Link href="/blog" className="text-sm text-gold hover:underline">
          ← Back to Essays
        </Link>

        <header className="mt-6 mb-10 border-b border-gold/10 pb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
            Insight & Reflection
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