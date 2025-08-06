import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import { motion } from 'framer-motion';
import { getAllPosts, PostMeta } from '../lib/posts';

// Define the props interface
interface HomeProps {
  posts: PostMeta[];
}

// Function to fetch data at build time
export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const allPosts = getAllPosts([
    'slug',
    'title',
    'date',
    'coverImage',
    'excerpt',
    'author',
  ]);
  const limitedPosts = allPosts.slice(0, 3);
  return {
    props: {
      posts: limitedPosts,
    },
  };
};

// Main Home component
export default function Home({ posts }: HomeProps) {
  const siteUrl = 'https://abrahamoflondon.org';
  const pageTitle = 'Abraham of London — Strategist & Storyteller';
  const pageDescription = 'Welcome to my world — where ideas are sharpened, values are lived, and every expression is an invitation to grow, reflect, and build a life of consequence.';
  // Corrected image path to match your file structure
  const ogImage = '/assets/images/social/og-image.jpg';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        {/* Corrected: The single quote in "life's" is now properly escaped with &apos; */}
        <meta name="description" content="Father, strategist, and student of life&apos;s deep currents." />
        {/* Updated OG and Twitter tags */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content={`${siteUrl}${ogImage}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
        <link rel="canonical" href={siteUrl} />
      </Head>

      <main className="container mx-auto px-4 py-12">
        {/* Hero / About Section with New Text */}
        <motion.section
          className="text-center max-w-3xl mx-auto mb-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
            variants={itemVariants}
          >
            Abraham of London
          </motion.h1>
          <motion.h2
            className="text-2xl md:text-3xl font-light text-gray-700 mb-8"
            variants={itemVariants}
          >
            Strategist & Storyteller
          </motion.h2>

          <motion.div
            className="space-y-6 text-lg text-gray-700 leading-relaxed"
            variants={containerVariants}
          >
            <motion.p variants={itemVariants}>
              Strategist, and student of life&apos;s deep currents. My journey has been shaped by a relentless pursuit of truth, legacy, and personal mastery. Through every venture, book, or conversation, I am crafting not just businesses, but enduring narratives that challenge, inspire, and provoke thoughtful action.
            </motion.p>
            <motion.p variants={itemVariants}>
              My work stands at the intersection of philosophy, creative expression, and human development. Whether through writing, brand building, or advisory, I see every project as a canvas — a medium to explore what it means to live meaningfully, lead courageously, and leave behind a legacy of substance.
            </motion.p>
            <motion.p variants={itemVariants}>
              I&apos;m less interested in transient trends and more invested in timeless truths. Family, faith, character, and creativity are the compass points that steer my endeavours. Every blog post, strategy session, or artistic project is my way of translating these convictions into tangible impact.
            </motion.p>
            <motion.p variants={itemVariants}>
              This is not just a brand; it&apos;s an unfolding life project. As seasons change, so do the mediums I employ — from thought leadership to immersive storytelling, from business ventures to deeply personal writings like Fathering Without Fear. It&apos;s all connected, because I am the connection.
            </motion.p>
            <motion.p variants={itemVariants}>
              Welcome to my world — where ideas are sharpened, values are lived, and every expression is an invitation to grow, reflect, and build a life of consequence.
            </motion.p>
          </motion.div>
        </motion.section>

        {/* Latest Posts Section */}
        <motion.section
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Latest Posts</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Link href={`/blog/${post.slug}`} className="group block">
                  <article className="border rounded-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                    {post.coverImage && (
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        width={800}
                        height={500}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 mt-2 line-clamp-3">{post.excerpt}</p>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </div>

          {posts.length >= 3 && (
            <div className="mt-10 text-center">
              <Link
                href="/blog"
                className="inline-block px-8 py-4 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors duration-300 text-lg font-semibold"
              >
                View All Posts
              </Link>
            </div>
          )}
        </motion.section>
      </main>
    </>
  );
}