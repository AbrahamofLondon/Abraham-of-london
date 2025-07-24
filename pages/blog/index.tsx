// pages/blog/index.tsx
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import BlogCard from '../../components/BlogCard';

interface Blog {
  slug: string;
  title: string;
  coverImage: string;
  author: string;
  excerpt: string;
}

interface BlogPageProps {
  blogs: Blog[];
}

export const getStaticProps = async () => {
  const blogs: Blog[] = [
    {
      slug: 'example-post',
      title: 'Example Blog Post',
      coverImage: '/assets/images/example-post.webp',
      author: 'Abraham of London',
      excerpt: 'A sample blog post.',
    },
  ];

  return {
    props: {
      blogs,
    },
  };
};

export default function Blog({ blogs }: BlogPageProps) {
  return (
    <Layout>
      <Head>
        <title>Blog | Abraham of London</title>
        <meta name="description" content="Read the latest posts from Abraham of London." />
      </Head>

      <div className="max-w-4xl mx-auto py-20 px-4">
        <h1 className="text-4xl font-bold mb-6 text-center">My Blog</h1>
        <p className="text-lg text-gray-600 mb-8 text-center">
          Explore my thoughts and insights.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <BlogCard key={blog.slug} {...blog} />
          ))}
        </div>
      </div>
    </Layout>
  );
}