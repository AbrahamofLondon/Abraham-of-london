// pages/blog/[slug].tsx — FINAL BUILD-PROOF (seed + proxy, Pages Router)

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";

import {
  getAllContentlayerDocs,
  getDocBySlug,
  normalizeSlug,
  sanitizeData,
} from "@/lib/content/server";

import { createSeededSafeMdxComponents } from "@/lib/mdx/safe-components";

type Props = {
  post: { title: string; excerpt: string | null; url: string };
  source: MDXRemoteSerializeResult;
  mdxRaw: string; // ✅ required for seeding
};

function isDraftContent(doc: any): boolean {
  if (!doc) return true;
  if (doc.draft === true) return true;
  if (doc.published === false) return true;
  const s = String(doc.status || "").toLowerCase();
  return s === "draft" || s === "unpublished";
}

function isPostDoc(d: any): boolean {
  const kind = String(d?.kind || d?.type || "").toLowerCase();
  if (kind === "post" || kind === "blog") return true;
  const dir = String(d?._raw?.sourceFileDir || "").toLowerCase();
  const flat = String(d?._raw?.flattenedPath || "").toLowerCase();
  return dir.includes("blog") || flat.startsWith("blog/");
}

function postSlugFromDoc(d: any): string {
  const raw =
    normalizeSlug(String(d.slug || "")) ||
    normalizeSlug(String(d._raw?.flattenedPath || "")) ||
    "";
  return raw.replace(/^blog\//, "").replace(/\.(md|mdx)$/i, "");
}

// Paranoid MDX extraction
function getRawBody(d: any): string {
  return (
    d?.body?.raw ||
    (typeof d?.bodyRaw === "string" ? d.bodyRaw : "") ||
    (typeof d?.content === "string" ? d.content : "") ||
    (typeof d?.body === "string" ? d.body : "") ||
    (typeof d?.mdx === "string" ? d.mdx : "") ||
    ""
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const docs = getAllContentlayerDocs();
    const posts = (Array.isArray(docs) ? docs : [])
      .filter(isPostDoc)
      .filter((p: any) => !isDraftContent(p));

    const paths = posts
      .map(postSlugFromDoc)
      .filter(Boolean)
      .map((slug: string) => ({ params: { slug } }));

    return { paths, fallback: "blocking" };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[blog/getStaticPaths] error:", e);
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const raw = params?.slug;
    const slug = Array.isArray(raw) ? raw[0] : raw;
    const s = normalizeSlug(String(slug || ""));
    if (!s) return { notFound: true };

    const doc = (getDocBySlug(`blog/${s}`) as any) || (getDocBySlug(s) as any);
    if (!doc || !isPostDoc(doc) || isDraftContent(doc)) return { notFound: true };

    const mdxRaw = getRawBody(doc);

    const source = await serialize(mdxRaw || " ", {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    });

    const cleanSlug = postSlugFromDoc(doc) || s;

    return {
      props: sanitizeData({
        post: {
          title: String(doc.title || "Post"),
          excerpt: typeof doc.excerpt === "string" ? doc.excerpt : null,
          url: `/blog/${cleanSlug}`,
        },
        source,
        mdxRaw,
      }),
      revalidate: 1800,
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[blog/getStaticProps] error:", e);
    return { notFound: true };
  }
};

const BlogPostPage: NextPage<Props> = ({ post, source, mdxRaw }) => {
  // ✅ Seed (enumerable) + Proxy (read-safe) => stops ResourcesCTA/BrandFrame/Rule/etc forever
  const safeComponents = React.useMemo(
    () =>
      createSeededSafeMdxComponents(mdxComponents, mdxRaw, {
        warnOnFallback: process.env.NODE_ENV === "development",
      }),
    [mdxRaw]
  );

  return (
    <Layout title={post.title} description={post.excerpt || ""}>
      <Head>
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt || ""} />
      </Head>

      <main className="min-h-screen bg-black text-cream pt-20 pb-20">
        <div className="mx-auto max-w-5xl px-6">
          <header className="mb-10 border-b border-white/10 pb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Blog</p>
            <h1 className="mt-4 font-serif text-4xl md:text-5xl text-white">{post.title}</h1>
            {post.excerpt ? <p className="mt-6 text-lg text-gray-400">{post.excerpt}</p> : null}
          </header>

          <article className="prose prose-invert prose-gold max-w-none">
            <MDXRemote {...source} components={safeComponents as any} />
          </article>
        </div>
      </main>
    </Layout>
  );
};

export default BlogPostPage;