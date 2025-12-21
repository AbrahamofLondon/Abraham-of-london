// pages/blog/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote } from "next-mdx-remote";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { getPublishedPosts, getPostBySlug } from "@/lib/contentlayer-helper";

type Props = {
  post: {
    title: string;
    excerpt: string | null;
    author: string | null;
    coverImage: string | null;
    date: string | null;
    slug: string; // last segment only
    url: string;  // canonical /blog/<slug>
  };
  source: MDXRemoteSerializeResult;
};

const SITE = "https://www.abrahamoflondon.org";

/** Basic clean helpers */
function toClean(input: unknown): string {
  let s = String(input ?? "").trim();
  if (!s) return "";
  s = s.split("#")[0]?.split("?")[0] ?? s;
  s = s.replace(/^https?:\/\/[^/]+/i, "");
  s = s.replace(/\/+$/, "");
  s = s.replace(/^\/+/, "");
  return s;
}

function lastSegment(pathLike: unknown): string {
  const s = toClean(pathLike).toLowerCase();
  if (!s) return "";
  const parts = s.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : s;
}

/**
 * CRITICAL:
 * Some blog MDX contains custom JSX components (Capitalized tags) that are not
 * present in mdxComponents scope. That crashes prerender + next export.
 *
 * This sanitizer:
 * - finds Capitalized JSX tags like <Callout ...> or <Quote />
 * - converts them to <div> / </div> and strips attributes
 *
 * Result: export-safe, content still readable.
 */
function sanitizeBlogMdx(raw: string): string {
  if (!raw) return raw;

  // 1) Self-closing: <MyComponent ... />
  raw = raw.replace(/<([A-Z][A-Za-z0-9_]*)\b[^>]*\/>/g, "<div />");

  // 2) Opening tags: <MyComponent ...>
  raw = raw.replace(/<([A-Z][A-Za-z0-9_]*)\b[^>]*>/g, "<div>");

  // 3) Closing tags: </MyComponent>
  raw = raw.replace(/<\/([A-Z][A-Za-z0-9_]*)\s*>/g, "</div>");

  return raw;
}

function getCanonicalFromDoc(doc: any) {
  const url = typeof doc?.url === "string" ? doc.url : "";
  const slug = lastSegment(url || doc?.slug || doc?._raw?.flattenedPath);
  const canonicalUrl = slug ? `/blog/${slug}` : "/blog";
  return { slug, url: canonicalUrl };
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getPublishedPosts();

  const paths = posts
    .map((p: any) => {
      const { slug } = getCanonicalFromDoc(p);
      return slug ? { params: { slug } } : null;
    })
    .filter(Boolean) as { params: { slug: string } }[];

  console.log(`📝 Blog: Generated ${paths.length} paths`);
  return { paths, fallback: false }; // required for export
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const requestedSlug = lastSegment(params?.slug);
  if (!requestedSlug) return { notFound: true };

  // Prefer canonical matching by url first:
  const byUrl = getPostBySlug(`/blog/${requestedSlug}`) || getPostBySlug(`blog/${requestedSlug}`);
  const rawDoc =
    byUrl ||
    getPostBySlug(requestedSlug) ||
    getPostBySlug(`/blog/${requestedSlug}`) ||
    null;

  if (!rawDoc) {
    console.warn(`⚠️ Blog post not found for slug: ${requestedSlug}`);
    return { notFound: true };
  }

  const { slug, url } = getCanonicalFromDoc(rawDoc);

  const post = {
    title: rawDoc.title || "Insight",
    excerpt: rawDoc.excerpt || rawDoc.description || null,
    author: rawDoc.author || null,
    coverImage: rawDoc.coverImage || null,
    date: rawDoc.date ? new Date(rawDoc.date).toISOString() : null,
    slug: slug || requestedSlug,
    url,
  };

  const raw = String(rawDoc?.body?.raw ?? "");
  const safeRaw = sanitizeBlogMdx(raw);

  let source: MDXRemoteSerializeResult;
  try {
    source = await serialize(safeRaw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ],
      },
    });
  } catch (err) {
    console.error(`❌ MDX serialize failed for /blog/${requestedSlug}`, err);
    source = await serialize("Content is being prepared.");
  }

  return {
    props: { post, source },
  };
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

          {post.excerpt ? (
            <p className="mt-4 text-gray-300">{post.excerpt}</p>
          ) : null}

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