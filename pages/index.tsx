// pages/index.tsx
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getAllPosts, PostMeta } from '../lib/posts';

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
    'readTime',
    'category',
    'tags',
    'description',
  ]);
  const limitedPosts = allPosts.slice(0, 6);
  return {
    props: {
      posts: limitedPosts,
    },
    revalidate: 86400,
  };
};

export default function Home({ posts }: HomeProps) {
  const siteUrl = 'https://abraham-of-london.netlify.app';
  const pageTitle = 'Abraham of London — Strategist & Storyteller';
  const pageDescription = 'Father, strategist, and student of life. Timeless values and modern leadership insights for men who want to make their lives count.';

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Abraham of London',
    description: pageDescription,
    url: siteUrl,
    sameAs: [],
    mainEntity: posts.slice(0, 3).map(post => ({
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt,
      datePublished: post.date,
      author: { '@type': 'Person', name: post.author || 'Abraham of London' },
      image: post.coverImage ? `${siteUrl}${post.coverImage}` : undefined,
      url: `${siteUrl}/blog/${post.slug}`,
    })).filter(entity => entity.image),
  };

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
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={`${siteUrl}/assets/images/social/og-image.jpg`} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={`${siteUrl}/assets/images/social/twitter-image.webp`} />
        <link rel="canonical" href={siteUrl} />
        <link rel="icon" href="/favicon/favicon.ico" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />

        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-GTYPQLW1T2"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-GTYPQLW1T2');
            `,
          }}
        />
      </Head>

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.section
          className="relative h-[70vh] md:h-[80vh] flex items-center justify-center text-white overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Image
            src="/assets/images/abraham-of-london-banner.webp"
            alt="Abraham of London - Transforming Industries, Inspiring Movements"
            fill
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            priority
            className="z-0"
            onError={(e) => {
              console.log('Hero banner failed to load, using fallback');
              (e.target as HTMLImageElement).src = '/assets/images/blog/leadership-begins-at-home.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/70 z-10" />

          <motion.div
            className="relative z-20 text-center px-6 max-w-5xl mx-auto"
            variants={containerVariants}
          >
            <motion.div
              className="mb-8"
              variants={itemVariants}
            >
              <Image
                src="/assets/images/logo/abraham-logo.jpg"
                alt="Abraham of London Logo"
                width={150}
                height={75}
                className="mx-auto drop-shadow-2xl"
                onError={() => console.log('Logo failed to load')}
              />
            </motion.div>
            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
              variants={itemVariants}
            >
              Strategist & Storyteller
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed text-gray-100"
              variants={itemVariants}
            >
              Timeless values meet modern leadership. Faith, family, character, and creative legacy.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              variants={itemVariants}
            >
              <Link
                href="/blog"
                className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 rounded-full text-lg font-semibold shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                Read Latest Posts
              </Link>
              <Link
                href="/about"
                className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-full text-lg font-semibold shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                About Abraham
              </Link>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Latest Posts Section */}
        <motion.section
          className="mt-16 mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Latest Reflections</h2>
            {posts.length > 3 && (
              <Link
                href="/blog"
                className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
              >
                View All Posts →
              </Link>
            )}
          </div>

          {posts.length > 0 ? (
            <motion.div
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
              initial="hidden"
              animate="visible"
            >
              {posts.map((post, index) => (
                <motion.div
                  key={post.slug}
                  variants={{
                    hidden: { opacity: 0, y: 30, scale: 0.95 },
                    visible: { opacity: 1, y: 0, scale: 1 },
                  }}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link href={`/blog/${post.slug}`} className="group block h-full">
                    <article className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-white">
                      {post.coverImage && (
                        <div className="relative overflow-hidden h-48">
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            width={400}
                            height={250}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading={index < 3 ? 'eager' : 'lazy'}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      )}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 mb-3 line-clamp-2">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-gray-600 line-clamp-3 mb-4 flex-1">{post.excerpt}</p>
                        )}
                        <div className="flex items-center justify-between text-sm text-gray-500 mt-auto">
                          <div className="flex items-center gap-4">
                            {post.date && (
                              <span>{new Date(post.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}</span>
                            )}
                            {post.readTime && (
                              <span>{post.readTime} min read</span>
                            )}
                          </div>
                          {post.category && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                              {post.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <div className="mb-6">
                <Image
                  src="/assets/images/blog/default-blog-cover.jpg"
                  alt="Coming Soon"
                  width={200}
                  height={150}
                  className="mx-auto rounded-lg opacity-50"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Posts Coming Soon</h3>
              <p className="text-gray-500">Check back soon for thoughtful insights and reflections.</p>
            </div>
          )}
        </motion.section>

        {/* About Section */}
        <motion.section
          className="mt-24 bg-gray-50 rounded-3xl p-8 md:p-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/3">
              <div className="relative">
                <Image
                  src="/assets/images/profile-portrait.webp"
                  alt="Abraham of London - Author and Strategist"
                  width={300}
                  height={300}
                  className="rounded-full shadow-2xl mx-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/images/profile-portrait-a.jpg';
                  }}
                />
                <div className="absolute inset-0 rounded-full border-4 border-blue-200 transform scale-110 opacity-30"></div>
              </div>
            </div>
            <div className="lg:w-2/3 text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Meet Abraham</h2>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed mb-8">
                <p>
                  Combining strategic insight with authentic storytelling to help leaders navigate
                  modern challenges while staying rooted in timeless principles.
                </p>
                <p>
                  Through writing, speaking, and mentoring, I bridge the gap between traditional
                  wisdom and contemporary leadership, helping men build legacies that matter.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/about"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
                >
                  <span className="mr-2">My Story</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center px-6 py-3 border-2 border-gray-800 text-gray-800 rounded-full hover:bg-gray-800 hover:text-white transition-all duration-300"
                >
                  Get In Touch
                </Link>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Newsletter Section */}
        <motion.section
          className="mt-24 bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-8 md:p-12 text-white text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Join the Conversation</h2>
            <p className="text-xl mb-8 text-blue-100">
              Receive thoughtful insights and updates on leadership, fatherhood, and building meaningful legacies.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-6 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-300"
                required
              />
              <button
                type="submit"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Subscribe
              </button>
            </form>
          </div>
        </motion.section>
      </main>
    </>
  );
}