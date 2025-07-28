// File: pages/index.tsx
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { GetStaticProps } from 'next';
import { getAllPosts, PostMeta } from '../lib/posts';
import BlogPostCard from '../components/BlogPostCard';
// Removed: import Layout from '../components/Layout'; // DELETE THIS LINE

interface HomeProps {
  latestPosts: PostMeta[];
}

const Home: React.FC<HomeProps> = ({ latestPosts }) => {
  const siteUrl = 'https://abrahamoflondon.org';
  const pageTitle = 'Abraham of London - Fearless Fatherhood & Legacy';
  const pageDescription =
    'Official website of Abraham of London, offering insights on fearless fatherhood, faith, justice, and building a lasting legacy.';
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
    <> {/* Replace <Layout> with a React Fragment */}
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
        <link rel="canonical" href={siteUrl} />
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-4 animate-fadeIn">
            Fearless Fatherhood & Lasting Legacy
          </h1>
          <p
            className="text-xl md:text-2xl mb-8 opacity-0 animate-fadeIn"
            style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}
          >
            Guiding men to lead with conviction, build strong families, and impact the world.
          </p>
          <div
            className="space-x-4 opacity-0 animate-fadeIn"
            style={{ animationDelay: '1s', animationFillMode: 'forwards' }}
          >
            <Link
              href="/blog"
              className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-3 rounded-full text-lg font-semibold transition duration-300 shadow-lg"
            >
              Read Blog
            </Link>
            <Link
              href="/books"
              className="border border-white text-white hover:bg-white hover:text-blue-700 px-8 py-3 rounded-full text-lg font-semibold transition duration-300 shadow-lg"
            >
              Explore Books
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Blog Posts Section */}
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
              <Link
                href="/blog"
                className="text-blue-600 hover:underline text-lg font-medium"
              >
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
            <Link
              href="/about"
              className="bg-blue-600 text-white px-6 py-3 rounded-full text-lg font-semibold transition duration-300 shadow-lg"
            >
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

      {/* Books Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Featured Books</h2>
          <p className="text-center text-gray-600">
            Content for featured books coming soon.{' '}
            <Link href="/books" className="text-blue-600 hover:underline">
              Explore all books &rarr;
            </Link>
          </p>
        </div>
      </section>
    </> // Replace </Layout> with a React Fragment
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
    'description',
  ]).slice(0, 3);

  return {
    props: {
      latestPosts,
    },
    revalidate: 1,
  };
};

export default Home;