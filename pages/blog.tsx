// pages/blog.tsx
import React from 'react';
import Head from 'next/head';
import type { GetStaticProps } from 'next';
import Layout from '../components/Layout';
import BlogPostCard from '../components/BlogPostCard';
import { getAllPosts, PostMeta } from '../lib/posts';

type BlogIndexProps = { posts: PostMeta[] };

export const getStaticProps: GetStaticProps<BlogIndexProps> = async () => {
  const data = getAllPosts([
    'slug',
    'title',
    'date',
    'publishedAt',
    'excerpt',
    'coverImage',
    'author',
    'readTime',
    'category',
    'tags',
  ]);

  const posts: PostMeta[] = data.map((p) => ({
    slug: p.slug || '',
    title: p.title || 'Untitled',
    date: (p.date || p.publishedAt || '') as string,
    excerpt: p.excerpt || 'Read more for full details.',
    coverImage:
      typeof p.coverImage === 'string' && p.coverImage.trim()
        ? p.coverImage
        : '/images/blog/default-blog-cover.jpg',
    author: p.author || 'Abraham of London',
    readTime: p.readTime || '5 min read',
    category: p.category || 'General',
    tags: Array.isArray(p.tags) ? p.tags : [],
  }));

  return { props: { posts }, revalidate: 60 };
};

export default function BlogIndex({ posts }: BlogIndexProps) {
  return (
    <Layout>
      <Head>
        <title>All Articles | Abraham of London</title>
        <meta
          name="description"
          content="Insights on leadership, fatherhood, and legacy from Abraham of London."
        />
        <meta property="og:image" content="/assets/social/og-image.jpg" />
      </Head>

      <section className="bg-warmWhite py-12">
        <div className="container px-4">
          <h1 className="font-serif text-3xl tracking-brand text-forest mb-8 text-center">
            All Articles
          </h1>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <BlogPostCard
                  key={post.slug || ''}
                  slug={post.slug || ''}
                  title={post.title || 'Untitled'}
                  date={post.date || ''}
                  excerpt={post.excerpt || 'Read more for full details.'}
                  coverImage={
                    typeof post.coverImage === 'string' && post.coverImage.trim()
                      ? post.coverImage
                      : '/images/blog/default-blog-cover.jpg'
                  }
                  author={post.author || 'Abraham of London'}
                  readTime={post.readTime || '5 min read'}
                  category={post.category || 'General'}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-deepCharcoal/70 text-lg">
              No blog posts found. Add files to <code className="px-1">content/blog</code>.
            </p>
          )}
        </div>
      </section>
    </Layout>
  );
}
