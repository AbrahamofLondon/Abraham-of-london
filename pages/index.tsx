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
  const ogImage = '/assets/images/og-image.jpg';

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
        url: `${siteUrl}/assets/images/abraham-logo.jpg`,
      },
    },
  };

  return (
    <Layout>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImage} />
        <link rel="canonical" href={siteUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </Head>

      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4">Fearless Fatherhood & Legacy</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
            Courageous insights on leadership, legacy, and fatherhood for men who want to make their lives count.
          </p>
          <div className="space-x-4">
            <Link href="/blog" className="bg-white text-blue-800 hover:bg-gray-100 px-8 py-3 rounded-full text-lg font-semibold shadow">
              Read Blog
            </Link>
            <Link href="/books" className="border border-white text-white hover:bg-white hover:text-blue-800 px-8 py-3 rounded-full text-lg font-semibold shadow">
              Explore Books
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Blog Posts */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Latest Insights</h2>
          {latestPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {latestPosts.map((post) => (
                <BlogPostCard key={post.slug} {...post} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No blog posts found yet.</p>
          )}
          {latestPosts.length > 0 && (
            <div className="text-center mt-12">
              <Link href="/blog" className="text-blue-600 hover:underline text-lg font-medium">
                View All Posts →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Featured Books */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Featured Books</h2>
          {featuredBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {featuredBooks.map((book) => (
                <BookCard key={book.slug} {...book} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">Books will be added soon.</p>
          )}
          <div className="text-center mt-12">
            <Link href="/books" className="text-blue-600 hover:underline text-lg font-medium">
              View All Books →
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 flex flex-col md:flex-row gap-10 items-center">
          <div className="md:w-1/2">
            <Image
              src="/assets/images/profile-portrait.webp"
              alt="Abraham of London"
              width={400}
              height={400}
              className="rounded-full shadow-xl"
            />
          </div>
          <div className="md:w-1/2">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">About Abraham of London</h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              I am Abraham of London — a storyteller, strategist, and student of life’s deep currents. My work is a reflection of timeless values: faith, family, character, and creative legacy.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              From immersive storytelling and thought leadership to advisory and authorship, I am committed to shaping lives and building enduring narratives. Every blog, book, or venture is part of this mission.
            </p>
            <Link href="/about" className="bg-blue-700 text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-blue-800 transition">
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

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
    'description',
  ]).slice(0, 3);

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
    revalidate: 60,
  };
};
