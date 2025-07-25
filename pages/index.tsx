// pages/index.tsx
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { GetStaticProps } from 'next';
import { getAllPosts, PostMeta } from '../lib/posts';
import BlogPostCard from '../components/BlogPostCard';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import EmailSignup from '../components/EmailSignup';

interface HomeProps {
  latestPosts: PostMeta[];
}

const Home: React.FC<HomeProps> = ({ latestPosts }) => {
  return (
    <Layout>
      <Head>
        <title>Abraham of London - Fearless Fatherhood & Legacy</title>
        <meta name="description" content="Official website of Abraham of London, offering insights on fearless fatherhood, faith, justice, and building a lasting legacy." />
        <meta property="og:image" content="/assets/images/og-image.jpg" />
        <meta name="twitter:image" content="/assets/images/twitter-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* Hero Section with Banner and Motion */}
      <section className="relative h-[90vh] bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: "url('/assets/images/abraham-of-london-banner.webp')" }}>
        <div className="bg-black/60 absolute inset-0 z-0" />
        <div className="relative z-10 text-center text-white px-4 max-w-3xl">
          <motion.h1
            className="text-5xl md:text-6xl font-extrabold mb-4"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Fearless Fatherhood & Lasting Legacy
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Guiding men to lead with conviction, build strong families, and impact the world.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <Link href="/blog" className="bg-white text-blue-700 px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-gray-100">
              Read Blog
            </Link>
            <Link href="/books" className="border border-white text-white px-6 py-3 rounded-full font-semibold hover:bg-white hover:text-blue-700">
              Explore Books
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Latest Blog Posts */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Latest Insights</h2>
          {latestPosts && latestPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {latestPosts.map((post) => (
                <BlogPostCard
                  key={post.slug}
                  slug={post.slug}
                  title={post.title}
                  date={post.date}
                  coverImage={post.coverImage}
                  excerpt={post.excerpt}
                  author={post.author}
                  readTime={post.readTime}
                  category={post.category}
                  tags={post.tags}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No blog posts found yet.</p>
          )}
          {latestPosts && latestPosts.length > 0 && (
            <div className="text-center mt-12">
              <Link href="/blog" className="text-blue-600 hover:underline text-lg font-medium">
                View All Posts &rarr;
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-10">
          <div className="md:w-1/2 text-center md:text-left">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">About Abraham of London</h2>
            <p className="text-lg text-gray-700 mb-4">
              Abraham is a passionate advocate for strong families and authentic leadership. Through his writings and teachings, he empowers individuals to embrace their roles with courage and build a legacy that matters.
            </p>
            <Link href="/about" className="bg-blue-600 text-white px-6 py-3 rounded-full text-lg font-semibold transition duration-300 shadow-lg">
              Learn More
            </Link>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <Image
              src="/assets/images/profile-portrait.webp"
              alt="Abraham of London"
              width={400}
              height={400}
              className="rounded-full shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Books CTA */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">My Books</h2>
          <p className="text-gray-600 text-lg mb-8">
            Explore resources designed to equip you with the principles for fearless fatherhood, unshakeable faith, and a lasting impact.
          </p>
          <Link href="/books" className="bg-green-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-green-700 transition duration-300 shadow-lg">
            View All Books
          </Link>
        </div>
      </section>

      {/* Email Signup */}
      <EmailSignup />
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const latestPosts = getAllPosts([
    'slug',
    'title',
    'date',
    'coverImage',
    'excerpt',
    'author',
    'readTime',
    'category',
    'tags',
  ]).slice(0, 3);

  return {
    props: {
      latestPosts,
    },
    revalidate: 1,
  };
};

export default Home;
