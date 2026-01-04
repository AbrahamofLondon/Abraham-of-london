import React from 'react';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { getServerAllPosts, getServerPostBySlug } from "@/lib/server/content";
import { sanitizeBlogMdx } from '@/lib/content/sanitize-mdx';

// Components required for spectacular MDX rendering
import BlogHeader from '@/components/blog/BlogHeader';
import BlogContent from '@/components/blog/BlogContent';
import BlogSidebar from '@/components/blog/BlogSidebar';
import BlogFooter from '@/components/blog/BlogFooter';
import ShareButtons from '@/components/ShareButtons';
import AuthorBio from '@/components/AuthorBio';
import RelatedPosts from '@/components/blog/RelatedPosts';
import ResourceGrid from '@/components/blog/ResourceGrid'; // ADDED

// Mapping components for MDX visibility
const mdxComponents = {
  ResourceGrid,
  // Add other spectacular components here
};

interface Post {
  title: string;
  excerpt: string | null;
  author: string | null;
  coverImage: string | null;
  date: string | null;
  slug: string;
  url: string;
  tags: string[];
}

interface Props {
  post: Post;
  source: MDXRemoteSerializeResult;
}

const BlogPostPage: NextPage<Props> = ({ post, source }) => {
  const metaDescription = post.excerpt || 'An insightful post from Abraham of London';
  const publishedDate = post.date ? new Date(post.date).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  return (
    <Layout>
      <Head>
        <title>{post.title} | Abraham of London</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={post.coverImage || '/assets/images/blog-default.jpg'} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={post.date || ''} />
        <meta property="article:author" content={post.author || 'Abraham of London'} />
        {post.tags && post.tags.map((tag, index) => (
          <meta key={index} property="article:tag" content={tag} />
        ))}
      </Head>

      <div className="min-h-screen bg-black selection:bg-amber-500 selection:text-black">
        {/* Hero Section */}
        <BlogHeader 
          title={post.title}
          author={post.author}
          date={publishedDate}
          coverImage={post.coverImage}
          tags={post.tags || []}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Main Content */}
            <main className="lg:col-span-8">
              <article className="prose prose-invert prose-amber max-w-none">
                <div className="bg-zinc-900/30 backdrop-blur-sm border border-white/5 rounded-3xl p-8 lg:p-16 shadow-2xl">
                  <BlogContent>
                    <MDXRemote {...source} components={mdxComponents} />
                  </BlogContent>
                  
                  <div className="mt-16 pt-8 border-t border-white/10">
                    <ShareButtons 
                      url={`https://abrahamoflondon.com${post.url}`}
                      title={post.title}
                      excerpt={post.excerpt || ''}
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

            {/* Sidebar */}
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

export default BlogPostPage;

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getServerAllPosts();

  const paths = posts
    .map((post) => post.slug)
    .filter(Boolean)
    .map((slug: string) => ({ params: { slug } }));

  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  if (!slug) return { notFound: true };

  const postData = await getServerPostBySlug(slug);
  if (!postData) return { notFound: true };

  const post = {
    title: postData.title || "Insight",
    excerpt: postData.excerpt || postData.description || null,
    author: postData.author || "Abraham of London",
    coverImage: postData.coverImage || postData.coverimage || null,
    date: postData.date ? new Date(postData.date).toISOString() : null,
    slug: postData.slug || slug,
    url: postData.url || `/blog/${postData.slug || slug}`,
    tags: Array.isArray(postData.tags) ? postData.tags : [],
  };

  const safeRaw = sanitizeBlogMdx(postData.body?.raw || postData.body || "");

  let source: MDXRemoteSerializeResult;
  try {
    source = await serialize(safeRaw || " ", {
      parseFrontmatter: true, // IMPORTANT: Handles nested metadata in .mdx
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug, 
          [rehypeAutolinkHeadings, { behavior: "wrap" }]
        ],
      },
    });
  } catch (err) {
    console.error(`MDX Serialization Error for ${slug}:`, err);
    source = await serialize("Institutional content is being prepared for display.");
  }

  return { props: { post, source }, revalidate: 1800 };
};