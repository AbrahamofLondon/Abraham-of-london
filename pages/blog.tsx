// pages/blog.tsx
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Layout from '../components/Layout';
import BlogPostCard from '../components/BlogPostCard';
import { getAllPosts, PostMeta } from '../lib/posts';

interface BlogProps {
  posts: PostMeta[];
}

export default function Blog({ posts }: BlogProps) {
  return (
    <Layout>
      <Head>
        <title>Blog | Abraham of London</title>
        <meta
          name="description"
          content="Thoughts and reflections on business, technology, and life."
        />
      </Head>
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-extrabold text-center mb-12">
          Latest Reflections
        </h1>
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} {...post} />
            ))}
          </div>
        ) : (
          <p className="text-center text-lg text-gray-600">
            No blog posts found.
          </p>
        )}
      </main>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const posts = getAllPosts([
    'slug',
    'title',
    'date',
    'coverImage',
    'excerpt',
    'author',
    'readTime',
    'category',
  ]);

  // Ensure all properties are present to avoid type errors.
  const postsWithRequiredProps = posts.map((post) => ({
    ...post,
    coverImage: post.coverImage || '/assets/images/default-blog-cover.jpg',
    excerpt: post.excerpt || 'Read this post for more insights.',
    readTime: post.readTime || '5 min read',
    author: post.author || 'Abraham Adaramola',
    category: post.category || 'General',
  }));

  return {
    props: {
      posts: postsWithRequiredProps,
    },
  };
};