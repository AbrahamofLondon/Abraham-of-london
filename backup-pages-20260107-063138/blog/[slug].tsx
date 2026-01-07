/* pages/blog/[slug].tsx - COMPLETE FIXED VERSION */
import React from "react";
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import Head from "next/head";
import Layout from "@/components/Layout";

// CLEAN IMPORTS - Direct from contentlayer-helper
import { getContentlayerData, isDraftContent, normalizeSlug, getDocHref, getAccessLevel } from "@/lib/contentlayer-compat";
import { prepareMDX, simpleMdxComponents, sanitizeData } from "@/lib/server/md-utils";

// BRAND UI COMPONENTS
import BlogHeader from "@/components/blog/BlogHeader";
import BlogContent from "@/components/blog/BlogContent";
import BlogSidebar from "@/components/blog/BlogSidebar";
import BlogFooter from "@/components/blog/BlogFooter";
import ShareButtons from "@/components/ShareButtons";
import AuthorBio from "@/components/AuthorBio";
import RelatedPosts from "@/components/blog/RelatedPosts";
import ResourceGrid from "@/components/blog/ResourceGrid";

/**
 * INSTITUTIONAL COMPONENT REGISTRY
 */
const extendedComponents = {
  ...simpleMdxComponents,
  ResourceGrid,
};

interface Props {
  post: {
    title: string;
    slug: string;
    date: string | null;
    author: string | null;
    excerpt: string | null;
    description: string | null;
    coverImage: string | null;
    tags: string[];
  };
  source: MDXRemoteSerializeResult;
}

const BlogPostPage: NextPage<Props> = ({ post, source }) => {
  const metaDescription =
    post.excerpt || post.description || "Insight from Abraham of London";

  const publishedDate = post.date
    ? new Date(post.date).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <Layout>
      <Head>
        <title>{post.title} | Abraham of London</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={metaDescription} />
        <meta
          property="og:image"
          content={post.coverImage || "/assets/images/blog-default.jpg"}
        />
      </Head>

      <div className="min-h-screen bg-black selection:bg-amber-500 selection:text-black">
        <BlogHeader
          title={post.title}
          author={post.author}
          date={publishedDate}
          coverImage={post.coverImage}
          tags={post.tags || []}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <main className="lg:col-span-8">
              <article className="prose prose-invert prose-amber max-w-none">
                <div className="bg-zinc-900/30 backdrop-blur-sm border border-white/5 rounded-3xl p-8 lg:p-16 shadow-2xl">
                  <BlogContent>
                    <MDXRemote {...source} components={extendedComponents} />
                  </BlogContent>

                  <div className="mt-16 pt-8 border-t border-white/10">
                    <ShareButtons
                      url={`https://abrahamoflondon.com/blog/${post.slug}`}
                      title={post.title}
                      excerpt={metaDescription}
                    />
                  </div>

                  {post.author && (
                    <div className="mt-16">
                      <AuthorBio author={post.author} />
                    </div>
                  )}
                </div>
              </article>

              <div className="mt-20">
                <RelatedPosts currentPostSlug={post.slug} />
              </div>
            </main>

            <aside className="lg:col-span-4 sticky top-24 self-start">
              <BlogSidebar
                author={post.author}
                publishedDate={publishedDate}
                tags={post.tags || []}
              />
            </aside>
          </div>
        </div>

        <BlogFooter />
      </div>
    </Layout>
  );
};

function toBlogSlug(p: any): string | null {
  const s = String(p?.slug ?? "").trim();
  if (s) return s;

  const raw = String(p?._raw?.flattenedPath ?? "").trim();
  if (!raw) return null;

  // Accept "posts/foo", "blog/foo", or "foo" and normalize to "foo"
  return raw.replace(/^\/?(posts|blog)\//, "").replace(/^\/+/, "") || null;
}

export const getStaticPaths: GetStaticPaths = async () => {
  // SIMPLE: Use (await getContentlayerData()).allPosts directly
  const posts = (await getContentlayerData()).allPosts;
  
  const filteredPosts = posts
    .filter((x: any) => x && !x.draft)
    .filter((x: any) => {
      const slug = x.slug || x._raw?.flattenedPath || "";
      return slug && !String(slug).includes("replace");
    });

  const paths = (filteredPosts || [])
    .map((p: any) => toBlogSlug(p))
    .filter(Boolean)
    .map((slug: string) => ({ params: { slug } }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim();
  if (!slug) return { notFound: true };

  const { allPosts } = await getContentlayerData();

  const doc =
    (allPosts ?? []).find((p: any) => {
      const s = normalizeSlug(p?.slug ?? p?._raw?.flattenedPath ?? "");
      return s === normalizeSlug(slug);
    }) ?? null;

  if (!doc || isDraftContent(doc)) return { notFound: true };

  const rawMdx = (doc as any)?.body?.raw ?? (doc as any)?.body ?? "";
  const source = await prepareMDX(typeof rawMdx === "string" ? rawMdx : "");

  const post = sanitizeData({
    title: doc.title || "Untitled Transmission",
    slug: normalizeSlug(doc.slug || slug),
    date: doc.date || null,
    author: doc.author || "Abraham of London",
    excerpt: doc.excerpt || null,
    description: doc.description || null,
    coverImage: doc.coverImage || null,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
  });

  return { props: { post, source }, revalidate: 1800 };
};