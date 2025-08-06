// pages/blog/index.tsx

import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { getAllPosts, PostMeta } from '../../lib/posts';
import BlogPostCard from '../../components/BlogPostCard';

interface BlogPageProps {
  posts: PostMeta[];
}

export const getStaticProps: GetStaticProps<BlogPageProps> = async () => {
  const posts = getAllPosts();
  return {
    props: { posts },
  };
};

export default function BlogPage({ posts }: BlogPageProps) {
  return (
    <>
      <Head>
        <title>Blog | Abraham of London</title>
        <meta
          name="description"
          content="Read blog posts by Abraham Adaramola on fatherhood, leadership, and reclaiming the narrative."
        />
        <meta property="og:title" content="Blog | Abraham of London" />
        <meta
          property="og:description"
          content="Insights and reflections by Abraham Adaramola on personal growth and social leadership."
        />
        <meta property="og:image" content="/assets/social/blog-og-image.jpg" />
        <meta property="og:url" content="https://abraham-of-london.netlify.app/blog" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Latest Blog Posts</h1>

        {posts.length === 0 ? (
          <p className="text-center text-gray-600">No posts available at this time.</p>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to home
          </Link>
        </div>
      </main>
    </>
  );
}
