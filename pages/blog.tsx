// pages/blog.tsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import BlogCard from '../components/BlogCard'; // Import as default, no curly braces

// This is a simplified example; you'll need actual data fetching (getStaticProps) for real blog posts
interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  category: string;
  author: string;
  readTime: string;
}

interface BlogPageProps {
  posts: BlogPost[];
}

export const getStaticProps = async () => {
  // Replace this with your actual data fetching logic (e.g., reading from content/blog)
  const posts: BlogPost[] = [
    {
      slug: 'fathering-without-fear',
      title: 'Fathering Without Fear',
      date: 'July 21, 2025',
      excerpt: 'Exploring the challenges and joys of modern fatherhood with practical wisdom.',
      coverImage: '/assets/images/blog/fathering-without-fear.webp', // Ensure this path is correct
      category: 'Parenting',
      author: 'Abraham of London',
      readTime: '8 min read'
    },
    {
      slug: 'principles-for-my-son',
      title: 'Principles For My Son',
      date: 'July 15, 2025',
      excerpt: 'Guiding principles for navigating life, shared from a father to his son.',
      coverImage: '/assets/images/blog/principles-for-my-son.webp', // Ensure this path is correct
      category: 'Life Lessons',
      author: 'Abraham of London',
      readTime: '6 min read'
    },
    // Add more posts as needed
  ];

  return {
    props: {
      posts,
    },
  };
};

export default function Blog({ posts }: BlogPageProps) {
  return (
    <Layout>
      <Head>
        <title>Blog | Abraham of London</title>
        <meta name="description" content="Explore insightful articles and thought leadership from Abraham of London." />
      </Head>

      <div className="max-w-5xl mx-auto py-20 px-4">
        <h1 className="text-4xl font-bold mb-6 text-center">My Blog</h1>
        <p className="text-lg text-gray-600 mb-12 text-center">
          Deep dives into parenting, personal growth, entrepreneurship, and societal impact.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <BlogCard key={post.slug} {...post} />
          ))}
        </div>
      </div>
    </Layout>
  );
}