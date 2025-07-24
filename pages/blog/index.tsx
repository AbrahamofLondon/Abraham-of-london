// pages/blog/index.tsx
<<<<<<< HEAD
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout'; // Path adjusted for nested folder
import BlogCard from '../../components/BlogCard'; // Path adjusted for nested folder

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
      coverImage: '/assets/images/blog/fathering-without-fear.webp',
      category: 'Parenting',
      author: 'Abraham of London',
      readTime: '8 min read'
    },
    {
      slug: 'principles-for-my-son',
      title: 'Principles For My Son',
      date: 'July 15, 2025',
      excerpt: 'Guiding principles for navigating life, shared from a father to his son.',
      coverImage: '/assets/images/blog/principles-for-my-son.webp',
      category: 'Life Lessons',
      author: 'Abraham of London',
      readTime: '6 min read'
    },
    {
      slug: 'fathering-principles',
      title: 'Fathering Principles',
      date: 'July 10, 2025',
      excerpt: 'Core principles that guide effective and loving fatherhood.',
      coverImage: '/assets/images/blog/fathering-principles.webp',
      category: 'Parenting',
      author: 'Abraham of London',
      readTime: '7 min read'
    },
    {
      slug: 'the-brotherhood-code',
      title: 'The Brotherhood Code',
      date: 'June 25, 2025',
      excerpt: 'Exploring the unspoken rules and values that bind men together in a strong community.',
      coverImage: '/assets/images/blog/the-brotherhood-code.webp',
      category: 'Community',
      author: 'Abraham of London',
      readTime: '9 min read'
    },
    {
      slug: 'reclaiming-the-narrative',
      title: 'Reclaiming The Narrative',
      date: 'June 18, 2025',
      excerpt: 'How to take control of your story and shape your destiny in a chaotic world.',
      coverImage: '/assets/images/blog/reclaiming-the-narrative.webp',
      category: 'Personal Growth',
      author: 'Abraham of London',
      readTime: '10 min read'
    },
    {
      slug: 'when-the-system-breaks-you',
      title: 'When The System Breaks You',
      date: 'June 10, 2025',
      excerpt: 'A raw look at overcoming systemic challenges and finding resilience.',
      coverImage: '/assets/images/blog/when-the-system-breaks-you.webp',
      category: 'Societal Impact',
      author: 'Abraham of London',
      readTime: '12 min read'
    }
=======
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
>>>>>>> 4de6a5e0bf2f09c14b0e904dd196874465326cf7
  ];

  return {
    props: {
<<<<<<< HEAD
      posts,
=======
      blogs,
>>>>>>> 4de6a5e0bf2f09c14b0e904dd196874465326cf7
    },
  };
};

<<<<<<< HEAD
export default function Blog({ posts }: BlogPageProps) {
=======
export default function Blog({ blogs }: BlogPageProps) {
>>>>>>> 4de6a5e0bf2f09c14b0e904dd196874465326cf7
  return (
    <Layout>
      <Head>
        <title>Blog | Abraham of London</title>
<<<<<<< HEAD
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
=======
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
>>>>>>> 4de6a5e0bf2f09c14b0e904dd196874465326cf7
          ))}
        </div>
      </div>
    </Layout>
  );
}