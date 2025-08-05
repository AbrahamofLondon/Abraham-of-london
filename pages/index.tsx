import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { GetStaticProps } from 'next';
import { getAllPosts, PostMeta } from '../lib/posts';
import { getAllBooks, BookMeta } from '../lib/books';
import BlogPostCard from '../components/BlogPostCard';
import BookCard from '../components/BookCard';
import Layout from '../components/Layout';

interface HomeProps {
  latestPosts: PostMeta[];
  featuredBooks: BookMeta[];
}

export default function Home({ latestPosts, featuredBooks }: HomeProps) {
  const siteUrl = 'https://abrahamoflondon.org';
  const pageTitle = 'Abraham of London - Fearless Fatherhood & Legacy';
  const pageDescription =
    'Official site of Abraham of London — philosopher, father, and builder of meaningful legacies through fearless storytelling and timeless leadership.';

  const heroImage = '/assets/images/hero-banner.jpg';
  const profileImage = '/assets/images/profile-portrait.webp';
  const ogImage = heroImage;
  const logoImage = '/assets/images/abraham-logo.jpg';

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: siteUrl,
    name: pageTitle,
    description: pageDescription,
    publisher: {
      '@type': 'Organization',
      name: 'Abraham of London',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}${logoImage}`,
      },
    },
    mainEntity: [
      ...latestPosts.map(post => ({
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.date,
        author: { '@type': 'Person', name: post.author },
        image: post.coverImage ? `${siteUrl}${post.coverImage}` : undefined,
        url: `${siteUrl}/blog/${post.slug}`,
      })),
      ...featuredBooks.map(book => ({
        '@type': 'Book',
        name: book.title,
        description: book.excerpt,
        author: { '@type': 'Person', name: book.author },
        image: book.coverImage ? `${siteUrl}${book.coverImage}` : undefined,
        url: `${siteUrl}/books/${book.slug}`,
      })),
    ].filter(entity => entity.image),
  };

  return (
    <Layout>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={`${siteUrl}${ogImage}`} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
        <link rel="canonical" href={siteUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </Head>

      {/* Hero with Next.js Image Component */}
      <section className="relative h-96 md:h-[600px] flex items-center justify-center text-white">
        <Image
          src={heroImage}
          alt="Hero Banner for Abraham of London"
          fill
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          priority
          className="z-0"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 z-10 flex flex-col items-center justify-center text-center p-6">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-fade-in">
            Fearless Fatherhood & Legacy
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto">
            Courageous insights on leadership, legacy, and fatherhood for men who want to make their lives count.
          </p>
          <div className="space-x-4 flex justify-center">
            <Link
              href="/blog"
              className="bg-white text-blue-800 hover:bg-gray-100 px-8 py-3 rounded-full text-lg font-semibold shadow-lg transition"
            >
              Read Blog
            </Link>
            <Link
              href="/books"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-800 px-8 py-3 rounded-full text-lg font-semibold shadow-lg transition"
            >
              Explore Books
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Blog Posts */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-14 text-gray-800">
            Latest Insights
          </h2>
          {latestPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestPosts.map((post) => (
                <BlogPostCard key={post.slug} {...post} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 text-lg">No blog posts found yet.</p>
          )}
          {latestPosts.length > 0 && (
            <div className="text-center mt-12">
              <Link
                href="/blog"
                className="text-blue-600 hover:underline text-xl font-medium transition"
              >
                View All Posts →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Featured Books */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-14 text-gray-800">
            Featured Books
          </h2>
          {featuredBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredBooks.map((book) => (
                <BookCard key={book.slug} {...book} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 text-lg">Books will be added soon.</p>
          )}
          <div className="text-center mt-12">
            <Link
              href="/books"
              className="text-blue-600 hover:underline text-xl font-medium transition"
            >
              View All Books →
            </Link>
          </div>
        </div>
      </section>

      {/* New: Call-to-Action Section */}
      <section className="bg-blue-800 text-white py-20 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Join the Community</h2>
          <p className="text-xl max-w-2xl mx-auto mb-8">
            Receive exclusive insights and updates on new books, articles, and events.
          </p>
          <form className="max-w-lg mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-grow px-6 py-3 rounded-full text-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                type="submit"
                className="bg-gold text-blue-800 hover:bg-yellow-400 px-8 py-3 rounded-full text-lg font-semibold transition duration-300"
              >
                Subscribe
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* About Section with Profile Image */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-10 items-center">
          <div className="lg:w-1/2">
            <Image
              src={profileImage}
              alt="Abraham of London"
              width={500}
              height={500}
              className="rounded-full shadow-2xl object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          <div className="lg:w-1/2">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">About Abraham of London</h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              I am Abraham of London — a storyteller, strategist, and student of life’s deep currents. My work is a reflection of timeless values: faith, family, character, and creative legacy.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              From immersive storytelling and thought leadership to advisory and authorship, I am committed to shaping lives and building enduring narratives. Every blog, book, or venture is part of this mission.
            </p>
            <Link
              href="/about"
              className="bg-blue-700 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-blue-800 transition-all duration-300"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  // CORRECTED: This now fetches all posts by removing the .slice() method.
  // The home page will now render all of them.
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
    'description',
  ]);

  // This still limits to 3, as it's a "featured" section.
  const featuredBooks = getAllBooks([
    'slug',
    'title',
    'coverImage',
    'excerpt',
    'author',
    'description',
    'category',
    'tags',
  ]).slice(0, 3);

  return {
    props: {
      latestPosts,
      featuredBooks,
    },
    revalidate: 86400,
  };
};