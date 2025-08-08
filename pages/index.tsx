// pages/index.tsx
import React from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import BookCard, { BookCardProps } from '../components/BookCard';
import BlogPostCard from '../components/BlogPostCard';
import { getAllPosts, PostMeta } from '../lib/posts';
import profilePortrait from '../public/assets/images/profile-portrait.webp';
import defaultBookCover from '../public/assets/images/default-book.jpg';

// Social preview images
import ogImage from '../public/assets/social/og-image.jpg';
import twitterImage from '../public/assets/social/twitter-image.webp';

// Book covers
import fatheringWithoutFear from '../public/assets/books/fathering-without-fear.jpg';
import fatheringPrinciples from '../public/assets/images/fathering-principles.jpg';
import fatheringWithoutFearTeaser from '../public/assets/images/fathering-without-fear-teaser.jpg';

// Additional brand images
import abrahamLogo from '../public/assets/images/abraham-logo.jpg';
import abrahamOfLondonBanner from '../public/assets/images/abraham-of-london-banner.webp';
import alomaradaLogo from '../public/assets/images/alomarada-ltd.webp';
import endureluxeLogo from '../public/assets/images/endureluxe-ltd.webp';

// Social media icons
import linkedinIcon from '../public/assets/social/linkedin.svg';
import twitterIcon from '../public/assets/social/twitter.svg';
import instagramIcon from '../public/assets/social/instagram.svg';

interface HomeProps {
  posts: PostMeta[];
}

// Animation variants
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
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const Home: React.FC<HomeProps> = ({ posts }) => {
  const siteTitle = 'Abraham of London';
  const siteDescription =
    'Fatherhood, leadership, and life lessons — empowering men to reclaim the narrative.';
  const siteUrl = 'https://abraham-of-london.netlify.app';
  const email = 'info@abrahamoflondon.org';
  const telephone = '+44 20 8062 25909';

  // Social media links
  const socialLinks = {
    linkedin: 'https://www.linkedin.com/in/abraham-adaramola-06630321/',
    twitter: 'https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09',
    instagram: 'https://www.instagram.com/abraham_of_london',
  };

  const books: BookCardProps[] = [
    {
      slug: 'fathering-without-fear',
      title: 'Fathering Without Fear',
      coverImage: fatheringWithoutFear.src,
      excerpt:
        'A heartfelt guide for fathers navigating the complexities of parenthood with courage, integrity, and love.',
      author: 'Abraham Adaramola',
      buyLink: 'https://example.com/buy/fathering-without-fear',
      downloadPdf: '/downloads/fathering-without-fear.pdf',
      downloadEpub: '/downloads/fathering-without-fear.epub',
      genre: 'Parenting & Fatherhood',
    },
    {
      slug: 'fathering-principles',
      title: 'Fathering Principles',
      coverImage: fatheringPrinciples.src,
      excerpt:
        'Essential principles every father should know to build strong, lasting relationships with their children.',
      author: 'Abraham Adaramola',
      buyLink: 'https://example.com/buy/fathering-principles',
      downloadPdf: '/downloads/fathering-principles.pdf',
      downloadEpub: '/downloads/fathering-principles.epub',
      genre: 'Parenting & Fatherhood',
    },
  ];

  // Get latest 3 posts for homepage
  const latestPosts = posts.slice(0, 3);

  return (
    <>
      <Head>
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="author" content="Abraham Adaramola" />
        <meta name="keywords" content="fatherhood, leadership, parenting, men, family, Abraham Adaramola" />

        {/* Open Graph */}
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content={`${siteUrl}${ogImage.src}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Abraham of London - Author and Father" />
        <meta property="og:site_name" content={siteTitle} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteDescription} />
        <meta name="twitter:image" content={`${siteUrl}${twitterImage.src}`} />
        <meta name="twitter:image:alt" content="Abraham of London - Author and Father" />
        <meta name="twitter:creator" content="@AbrahamAda48634" />

        {/* Additional SEO meta tags */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={siteUrl} />

        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "AbrahamofLondon",
              "alternateName": "Abraham of London",
              "url": siteUrl,
              "image": `${siteUrl}${profilePortrait.src}`,
              "description": siteDescription,
              "email": email,
              "telephone": telephone,
              "jobTitle": "Author & Father",
              "worksFor": {
                "@type": "Organization",
                "name": "Abraham of London"
              },
              "sameAs": [
                socialLinks.linkedin,
                socialLinks.twitter,
                socialLinks.instagram
              ]
            })
          }}
        />
        {/* Note: Ensure all special characters in content are escaped to prevent syntax errors */}
      </Head>

      <div className="min-h-screen bg-white">
        <main className="max-w-6xl mx-auto px-4 py-12">
          {/* Hero Section */}
          <motion.section
            className="text-center mb-20"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div className="flex justify-center mb-6" variants={itemVariants}>
              <div className="relative">
                <Image
                  src={profilePortrait}
                  alt="Portrait of AbrahamofLondon"
                  width={160}
                  height={160}
                  className="rounded-full shadow-lg transition-transform hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 rounded-full ring-4 ring-blue-100 ring-opacity-50"></div>
              </div>
            </motion.div>
            <motion.h1
              className="text-4xl md:text-6xl font-bold mb-4 text-gray-900"
              variants={itemVariants}
            >
              {siteTitle}
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8"
              variants={itemVariants}
            >
              {siteDescription}
            </motion.p>
            <motion.div
              className="flex flex-wrap justify-center gap-4"
              variants={itemVariants}
            >
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Get in Touch
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center px-8 py-4 border-2 border-gray-600 text-gray-600 rounded-full hover:bg-gray-600 hover:text-white transition-colors"
              >
                Learn More
              </Link>
            </motion.div>
          </motion.section>

          {/* Brand Showcase Section */}
          <motion.section
            className="mb-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-800">
              Brand Partners & Ventures
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
              <motion.div
                className="transition-transform hover:scale-105"
                whileHover={{ scale: 1.05 }}
              >
                <Image
                  src={abrahamLogo}
                  alt="Abraham of London Logo"
                  width={120}
                  height={120}
                  className="rounded-lg shadow-sm"
                />
              </motion.div>
              <motion.div
                className="transition-transform hover:scale-105"
                whileHover={{ scale: 1.05 }}
              >
                <Image
                  src={alomaradaLogo}
                  alt="Alomarada Ltd"
                  width={120}
                  height={120}
                  className="rounded-lg shadow-sm"
                />
              </motion.div>
              <motion.div
                className="transition-transform hover:scale-105"
                whileHover={{ scale: 1.05 }}
              >
                <Image
                  src={endureluxeLogo}
                  alt="Endureluxe Ltd"
                  width={120}
                  height={120}
                  className="rounded-lg shadow-sm"
                />
              </motion.div>
              <motion.div
                className="transition-transform hover:scale-105"
                whileHover={{ scale: 1.05 }}
              >
                <Image
                  src={abrahamOfLondonBanner}
                  alt="Abraham of London Banner"
                  width={200}
                  height={100}
                  className="rounded-lg shadow-sm"
                />
              </motion.div>
            </div>
          </motion.section>

          {/* Featured Books Section */}
          <motion.section
            className="mb-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-800">
              Featured Books
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
              {books.map((book) => (
                <motion.div
                  key={book.slug}
                  className="transform transition-transform hover:scale-105"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <BookCard
                    {...book}
                    coverImage={book.coverImage || defaultBookCover.src}
                  />
                </motion.div>
              ))}
            </div>
            
            {/* Book Teaser Section */}
            <motion.div
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-2xl font-bold mb-6 text-gray-800">Coming Soon</h3>
              <div className="inline-block">
                <Image
                  src={fatheringWithoutFearTeaser}
                  alt="Fathering Without Fear - Coming Soon"
                  width={200}
                  height={300}
                  className="rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                />
                <p className="mt-4 text-gray-600 font-medium">
                  More insights on fatherhood coming your way
                </p>
              </div>
            </motion.div>
          </motion.section>

          {/* Latest Posts Section */}
          {latestPosts.length > 0 && (
            <motion.section
              className="mb-20"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                  Latest Reflections
                </h2>
                <Link
                  href="/blog"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-800 rounded-full hover:bg-gray-100 transition-colors group"
                >
                  View All
                  <svg className="h-5 w-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={containerVariants}
              >
                {latestPosts.map((post) => (
                  <motion.div key={post.slug} variants={itemVariants}>
                    <BlogPostCard {...post} />
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>
          )}

          {/* About Section */}
          <motion.section
            className="mb-20 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-800">
              About Me
            </h2>
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-8 shadow-sm">
              <p className="text-gray-700 leading-relaxed text-lg text-center">
                I&apos;m AbrahamofLondon — a father, author, and advocate for men&apos;s
                voices in family narratives. My mission is to inspire fathers to
                embrace their role with confidence and compassion, while navigating
                life&apos;s challenges with resilience.
              </p>
              <div className="text-center mt-6">
                <Link
                  href="/about"
                  className="inline-flex items-center px-6 py-3 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Read My Full Story
                  <svg className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </motion.section>

          {/* Contact & Social Section */}
          <motion.section
            className="bg-gradient-to-r from-blue-50 to-indigo-50 py-12 px-8 rounded-xl shadow-sm max-w-4xl mx-auto text-center mb-12"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-800">
              Get in Touch
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Email</h3>
                <a
                  href={`mailto:${email}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline transition-colors text-lg"
                  aria-label={`Send email to ${email}`}
                >
                  {email}
                </a>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Phone</h3>
                <a
                  href={`tel:${telephone}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline transition-colors text-lg"
                  aria-label={`Call ${telephone}`}
                >
                  {telephone}
                </a>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">
                Follow My Journey
              </h3>
              <div className="flex justify-center space-x-8">
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn Profile"
                  className="transition-transform hover:scale-110"
                >
                  <Image src={linkedinIcon} alt="LinkedIn" width={44} height={44} />
                </a>
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter Profile"
                  className="transition-transform hover:scale-110"
                >
                  <Image src={twitterIcon} alt="Twitter" width={44} height={44} />
                </a>
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram Profile"
                  className="transition-transform hover:scale-110"
                >
                  <Image src={instagramIcon} alt="Instagram" width={44} height={44} />
                </a>
              </div>
            </div>
          </motion.section>

          {/* Newsletter Section */}
          <motion.section
            className="bg-blue-600 text-white py-16 px-8 rounded-2xl shadow-xl text-center mb-12"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Join My Newsletter</h2>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Receive exclusive insights on fatherhood, leadership, and life lessons directly in your inbox.
            </p>
            <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-white transition-colors"
                required
              />
              <button
                type="submit"
                className="px-8 py-3 bg-white text-blue-600 font-bold rounded-full shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              >
                Subscribe
              </button>
            </form>
          </motion.section>
        </main>

        <footer className="bg-gray-900 text-white text-center py-8 mt-16">
          <div className="max-w-4xl mx-auto px-4">
            <p className="text-lg mb-2">
              &copy; {new Date().getFullYear()} {siteTitle}. All rights reserved.
            </p>
            <p className="text-sm text-gray-400">
              Built with ❤️ using Next.js
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  try {
    const posts = getAllPosts(['slug', 'title', 'date', 'coverImage', 'excerpt']);
    
    return {
      props: { 
        posts: posts || [] 
      },
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return {
      props: { 
        posts: [] 
      },
    };
  }
};

export default Home;