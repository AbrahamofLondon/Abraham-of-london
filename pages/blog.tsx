// pages/blog.tsx
import Head from 'next/head';
import type { GetStaticProps } from 'next';
import Layout from '../components/Layout';
import BlogPostCard from '../components/BlogPostCard';
import { getAllPosts, PostMeta } from '../lib/posts';

type BlogCardData = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  author: string;
  readTime: string;
  category: string;
};

type BlogIndexProps = {
  posts: BlogCardData[];
};

export const getStaticProps: GetStaticProps<BlogIndexProps> = async () => {
  const postsData = getAllPosts([
    'slug',
    'title',
    'date',
    'excerpt',
    'coverImage',
    'author',
    'readTime',
    'category',
    'tags',
  ]);

  const posts: BlogCardData[] = postsData.map((p: Partial<PostMeta>) => ({
    slug: p.slug || '',
    title: p.title || 'Untitled',
    // Only use `date` (your PostMeta does not include publishedAt)
    date: p.date || '',
    excerpt: p.excerpt || 'Read more for full details.',
    coverImage:
      typeof p.coverImage === 'string' && p.coverImage.trim().length > 0
        ? p.coverImage
        : '/assets/images/default-blog-cover.jpg',
    author: p.author || 'Abraham of London',
    readTime: p.readTime || '5 min read',
    category: p.category || 'General',
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
        <meta property="og:title" content="All Articles | Abraham of London" />
        <meta
          property="og:description"
          content="Insights on leadership, fatherhood, and legacy from Abraham of London."
        />
        <meta property="og:image" content="/assets/social/og-image.jpg" />
      </Head>

      <section className="bg-warm-white py-12">
        <div className="container px-4">
          <h1 className="font-serif text-3xl tracking-brand text-forest mb-8 text-center">
            All Articles
          </h1>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <BlogPostCard
                  key={post.slug}
                  slug={post.slug}
                  title={post.title}
                  date={post.date}
                  excerpt={post.excerpt}
                  coverImage={post.coverImage}
                  author={post.author}
                  readTime={post.readTime}
                  category={post.category}
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
