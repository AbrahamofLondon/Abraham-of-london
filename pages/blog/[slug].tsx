/* pages/blog/[slug].tsx — Production Stable (Pages Router, map-safe) */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";

import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import {
  getAllContentlayerDocs,
  getDocBySlug,
  normalizeSlug,
  sanitizeData,
} from "@/lib/content/server";

// Client-only enhancements
const ReadingProgress = dynamic(() => import("@/components/enhanced/ReadingProgress"), { ssr: false });
const BackToTop = dynamic(() => import("@/components/enhanced/BackToTop"), { ssr: false });
const TableOfContents = dynamic(() => import("@/components/enhanced/TableOfContents"), { ssr: false });
const ReadTime = dynamic(() => import("@/components/enhanced/ReadTime"), { ssr: false });

type PostDoc = {
  title?: string | null;
  excerpt?: string | null;
  description?: string | null;
  date?: string | null;
  author?: string | null;
  slug?: string | null;
  tags?: string[] | null;
  coverImage?: string | null;
  draft?: boolean;
  published?: boolean;
  status?: string;
  accessLevel?: string | null;
  body?: { raw?: string };
  bodyRaw?: string;
  _raw?: { flattenedPath?: string; sourceFileDir?: string };
  kind?: string;
  type?: string;
  [k: string]: any;
};

type Props = {
  post: {
    title: string;
    excerpt: string | null;
    description: string | null;
    date: string | null;
    author: string | null;
    slug: string;
    url: string;
    tags: string[];
    coverImage: string | null;
    readTime: string | null;
  };
  source: MDXRemoteSerializeResult;
};

function isDraftContent(doc: any): boolean {
  if (!doc) return true;
  if (doc.draft === true) return true;
  if (doc.published === false) return true;
  const s = String(doc.status || "").toLowerCase();
  if (s === "draft" || s === "unpublished") return true;
  return false;
}

function isPostDoc(d: any): boolean {
  const kind = String(d?.kind || d?.type || "").toLowerCase();
  if (kind === "post" || kind === "blog") return true;
  const dir = String(d?._raw?.sourceFileDir || "").toLowerCase();
  const flat = String(d?._raw?.flattenedPath || "").toLowerCase();
  return dir.includes("blog") || flat.startsWith("blog/");
}

function postSlugFromDoc(d: PostDoc): string {
  const raw =
    normalizeSlug(String(d.slug || "")) ||
    normalizeSlug(String(d._raw?.flattenedPath || "")) ||
    "";
  return raw.replace(/^blog\//, "").replace(/\.(md|mdx)$/i, "");
}

function getRawBody(d: PostDoc): string {
  return d?.body?.raw || (typeof d?.bodyRaw === "string" ? d.bodyRaw : "") || "";
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const docs = getAllContentlayerDocs();
    const posts = (Array.isArray(docs) ? docs : [])
      .filter(isPostDoc)
      .filter((p: any) => !isDraftContent(p));

    const paths = posts
      .map((p: any) => postSlugFromDoc(p))
      .filter(Boolean)
      .map((slug: string) => ({ params: { slug } }));

    return { paths, fallback: "blocking" };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Error generating blog paths:", e);
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const raw = params?.slug;
    const slug = Array.isArray(raw) ? raw[0] : raw;
    const s = normalizeSlug(String(slug || ""));
    if (!s) return { notFound: true };

    const doc =
      (getDocBySlug(`blog/${s}`) as PostDoc | null) ||
      (getDocBySlug(s) as PostDoc | null);

    if (!doc || !isPostDoc(doc) || isDraftContent(doc)) return { notFound: true };

    const mdx = getRawBody(doc);
    const source = await serialize(mdx || " ", {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    });

    const cleanSlug = postSlugFromDoc(doc) || s;
    const url = `/blog/${cleanSlug}`;

    const post = {
      title: String(doc.title || "Post").trim() || "Post",
      excerpt: typeof doc.excerpt === "string" ? doc.excerpt : null,
      description: typeof doc.description === "string" ? doc.description : (typeof doc.excerpt === "string" ? doc.excerpt : null),
      date: typeof doc.date === "string" ? doc.date : null,
      author: typeof doc.author === "string" ? doc.author : "Abraham of London",
      slug: cleanSlug,
      url,
      tags: Array.isArray(doc.tags) ? doc.tags : [],
      coverImage: typeof doc.coverImage === "string" ? doc.coverImage : null,
      readTime: typeof (doc as any).readTime === "string" ? (doc as any).readTime : null,
    };

    return {
      props: sanitizeData({
        post,
        source,
      }),
      revalidate: 1800,
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Error building blog slug:", e);
    return { notFound: true };
  }
};

const BlogPostPage: NextPage<Props> = ({ post, source }) => {
  const tags = Array.isArray(post.tags) ? post.tags : [];

  return (
    <Layout title={post.title} description={post.description || post.excerpt || ""} ogImage={post.coverImage || ""}>
      <Head>
        <link rel="canonical" href={`https://www.abrahamoflondon.org${post.url}`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://www.abrahamoflondon.org${post.url}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description || post.excerpt || ""} />
        {post.coverImage ? <meta property="og:image" content={post.coverImage} /> : null}
      </Head>

      <ReadingProgress />

      <main className="min-h-screen bg-black text-cream pt-20 pb-20">
        <div className="mx-auto max-w-6xl px-6">
          <header className="mb-10 border-b border-white/10 pb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Blog</p>
            <h1 className="mt-4 font-serif text-4xl md:text-5xl text-white">{post.title}</h1>
            {post.excerpt ? <p className="mt-6 text-lg text-gray-400">{post.excerpt}</p> : null}

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-gray-500">
              {post.date ? <span>{new Date(post.date).toLocaleDateString("en-GB")}</span> : null}
              {post.readTime ? (
                <span className="inline-flex items-center gap-2">
                  <ReadTime content={post.readTime} />
                  <span>{post.readTime}</span>
                </span>
              ) : null}
              {post.author ? <span>— {post.author}</span> : null}
            </div>

            {tags.length ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            ) : null}
          </header>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <aside className="lg:col-span-3">
              <div className="sticky top-24">
                <TableOfContents contentRef={null as any} content={(source as any)?.compiledSource || ""} />
              </div>
            </aside>

            <article className="lg:col-span-9 prose prose-invert prose-gold max-w-none">
              <MDXRemote {...source} components={mdxComponents as any} />
            </article>
          </div>
        </div>
      </main>

      <BackToTop />
    </Layout>
  );
};

export default BlogPostPage;