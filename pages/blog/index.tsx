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
    props: {
      posts,
    },
  };
};

export default function BlogPage({ posts }: BlogPageProps) {
  return (
    <>
      <Head>
        <title>Blog | Abraham of London</title>
        <meta name="description" content="Read the latest blog posts by Abraham Adaramola on fatherhood, leadership, and reclaiming the narrative." />
      </Head>
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold mb-8">Latest Blog Posts</h1>
        {posts.length === 0 ? (
          <p>No posts available at this time.</p>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
        <div className="mt-10">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to home
          </Link>
        </div>
      </main>
    </>
  );
}
