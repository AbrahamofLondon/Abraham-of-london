// pages/index.tsx 
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getAllPosts, PostMeta } from '../lib/posts'; // Changed Post to PostMeta

interface HomeProps {
  posts: PostMeta[]; // Changed Post[] to PostMeta[]
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  // Add the fields array that getAllPosts expects
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

export default function Home({ posts }: HomeProps) {
  return (
    <>
      <Head>
        <title>Abraham of London — Strategist & Storyteller</title>
        <meta name="description" content="Father, strategist, and student of life. Timeless values and modern leadership insights." />
        <meta property="og:title" content="Abraham of London — Strategist & Storyteller" />
        <meta property="og:description" content="Faith, family, character, and legacy. Leadership insights for men rooted in timeless values." />
        <meta property="og:image" content="/images/social/og-image.jpg" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Abraham of London" />
        <meta name="twitter:description" content="Leadership, faith, and fatherhood." />
        <meta name="twitter:image" content="/images/social/twitter-image.jpg" />
      </Head>

      <main className="container mx-auto px-4 py-12">
        <motion.section
          className="text-center max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Welcome</h1>
          <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
            <p>
              I am Abraham of London — a strategist, father, and student of life's deep currents.
              My work is a reflection of timeless values: faith, family, character, and creative legacy.
            </p>
            <p>
              From transforming industries to inspiring movements, I am committed to shaping lives and building enduring narratives.
              Every blog post, book, and initiative serves this greater mission.
            </p>
            <p>
              My approach combines strategic thinking with authentic storytelling,
              helping men navigate the complexities of modern leadership while staying rooted in principles that matter.
            </p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Latest Posts</h2>
          <div className="grid gap-8 md:grid-cols-2">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                <article className="border rounded-xl overflow-hidden hover:shadow-lg transition">
                  {post.coverImage && (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      width={800}
                      height={500}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:underline">{post.title}</h3>
                    <p className="text-gray-600 mt-2 line-clamp-3">{post.excerpt}</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {posts.length >= 3 && (
            <div className="mt-10 text-center">
              <Link
                href="/blog"
                className="inline-block px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition"
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