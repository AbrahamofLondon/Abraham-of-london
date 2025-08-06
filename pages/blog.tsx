import { GetStaticProps } from 'next';
import Head from 'next/head';
import { getAllPosts, PostMeta } from '../lib/posts';
import BlogPostCard from '../components/BlogPostCard';

interface BlogProps {
  posts: PostMeta[];
}

export default function Blog({ posts }: BlogProps) {
  const pageTitle = 'Abraham of London - Blog';
  const pageDescription = 'Read the latest blog posts from Abraham of London on various topics related to fearless fatherhood and legacy.';
  const siteUrl = 'https://abrahamoflondon.org';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${siteUrl}/blog`} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <link rel="canonical" href={`${siteUrl}/blog`} />
      </Head>

      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">All Blog Posts</h1>
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <BlogPostCard key={post.slug} {...post} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No blog posts found yet.</p>
          )}
        </div>
      </section>
    </>
  );
}

export const getStaticProps: GetStaticProps<BlogProps> = async () => {
  const posts = getAllPosts([
    'slug',
    'title',
    'date',
    'coverImage',
    'excerpt',
    'author',
    'readTime',
    'category',
    'tags',
  ]);

  return {
    props: {
      posts,
    },
    revalidate: 1,
  };
};