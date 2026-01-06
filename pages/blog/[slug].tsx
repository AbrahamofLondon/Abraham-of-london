/* pages/blog/[slug].tsx - COMPLETE FIXED VERSION */
import React from "react";
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import Head from "next/head";
import Layout from "@/components/Layout";

// CLEAN IMPORTS - Direct from contentlayer-helper
import { getAllPosts, getDocumentBySlug } from '@/lib/contentlayer';
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
  // SIMPLE: Use getAllPosts() directly
  const posts = getAllPosts();
  
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

  // SIMPLE: Use getDocumentBySlug() directly
  const data = getDocumentBySlug(slug);
  if (!data) return { notFound: true };

  // Prepare MDX content
  const rawMdx = (data as any)?.body?.raw ?? (data as any)?.body ?? "";
  const source = await prepareMDX(typeof rawMdx === "string" ? rawMdx : "");

  // JSON-safe mapping
  const post = sanitizeData({
    title: data.title || "Untitled Transmission",
    slug: data.slug || slug,
    date: data.date || null,
    author: data.author || "Abraham of London",
    excerpt: data.excerpt || null,
    description: data.description || null,
    coverImage: data.coverImage || data.coverimage || null,
    tags: Array.isArray(data.tags) ? data.tags : [],
  });

  return {
    props: { post, source },
    revalidate: 1800,
  };
};

export default BlogPostPage;
