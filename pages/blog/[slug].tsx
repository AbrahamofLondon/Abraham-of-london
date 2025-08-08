// pages/blog/[slug].tsx
import React from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { getAllPosts, getPostBySlug, PostMeta } from '../../lib/posts';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';

type PostWithContent = PostMeta & { content?: string };

type BlogPostProps = {
  frontmatter: PostMeta;
  mdxSource: MDXRemoteSerializeResult;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPosts(['slug']);
  return {
    paths: posts.map((p) => ({ params: { slug: p.slug! } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<BlogPostProps> = async ({ params }) => {
  const slug = String(params?.slug || '');
  const post = getPostBySlug(slug, [
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
    'content',
  ]) as PostWithContent;

  const mdxSource = await serialize(post.content ?? '');

  return {
    props: {
      frontmatter: {
        slug: post.slug!,
        title: post.title || 'Untitled',
        date: post.date || post.publishedAt || '',
        excerpt: post.excerpt || '',
        coverImage: post.coverImage || '/assets/images/default-blog-cover.jpg',
        author: post.author || 'Abraham of London',
        readTime: post.readTime || '5 min read',
        category: post.category || 'General',
        tags: post.tags || [],
      },
      mdxSource,
    },
    revalidate: 60,
  };
};

export default function BlogPost({ frontmatter, mdxSource }: BlogPostProps) {
  return (
    <Layout>
      <Head>
        <title>{frontmatter.title} | Abraham of London</title>
        <meta name="description" content={frontmatter.excerpt} />
        <meta property="og:title" content={`${frontmatter.title} | Abraham of London`} />
        <meta property="og:description" content={frontmatter.excerpt} />
        <meta property="og:image" content={frontmatter.coverImage} />
      </Head>

      <article className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-8">
          <h1 className="font-serif tracking-brand text-4xl text-forest mb-3">{frontmatter.title}</h1>
          <p className="text-sm text-deepCharcoal/70">
            {frontmatter.date} · {frontmatter.author}
            {frontmatter.readTime ? ` · ${frontmatter.readTime}` : null}
          </p>
        </header>

        <div className="prose prose-lg max-w-none text-deepCharcoal">
          <MDXRemote {...mdxSource} />
        </div>

        {frontmatter.tags && frontmatter.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2 mt-8">
            {frontmatter.tags.map((t) => (
              <li key={t} className="text-xs uppercase tracking-wide text-forest border border-lightGrey px-3 py-1">
                {t}
              </li>
            ))}
          </ul>
        )}
      </article>
    </Layout>
  );
}
