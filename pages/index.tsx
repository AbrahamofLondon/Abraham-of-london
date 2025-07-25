import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import Layout from '../components/Layout';
import BlogCard from '../components/BlogCard';
import { getAllPosts, PostMeta } from '../lib/posts';

interface HomeProps {
  latestPosts: PostMeta[];
}

const Home: React.FC<HomeProps> = ({ latestPosts }) => {
  return (
    <Layout>
      <Head>
        <title>Abraham of London - Fearless Fatherhood & Legacy</title>
        <meta name="description" content="Official website of Abraham of London, offering insights on fearless fatherhood, faith, justice, and building a lasting legacy." />
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.abrahamoflondon.com/" />
        <meta property="og:title" content="Abraham of London - Fearless Fatherhood & Legacy" />
        <meta property="og:description" content="Official website of Abraham of London, offering insights on fearless fatherhood, faith, justice, and building a lasting legacy." />
        <meta property="og:image" content="/assets/images/og-image.jpg" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://www.abrahamoflondon.com/" />
        <meta property="twitter:title" content="Abraham of London - Fearless Fatherhood & Legacy" />
        <meta property="twitter:description" content="Official website of Abraham of London, offering insights on fearless fatherhood, faith, justice, and building a lasting legacy." />
        <meta property="twitter:image" content="/assets/images/twitter-image.jpg" />
      </Head>

      {/* Hero Section */}
      <section className="bg-blue-800 text-white py-20 px-4 text-center">
        <div className="container mx-auto">
          <h1 className="text-5xl font-bold mb-4">Abraham of London</h1>
          <p className="text-xl mb-8">Fearless Fatherhood. Unwavering Faith. Lasting Legacy.</p>
          <Link href="/about" className="bg-white text-blue-800 px-6 py-3 rounded-full text-lg font-semibold hover:bg-gray-200 transition duration-300">
            Learn More
          </Link>
        </div>
      </section>

      {/* Latest Blog Posts Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Latest Insights</h2>
          {latestPosts && latestPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestPosts.map((post) => {
                return (
                  <BlogCard
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
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-600">No blog posts found yet.</p>
          )}
          <div className="text-center mt-8">
            <Link href="/blog" className="text-blue-600 hover:underline text-lg font-medium">
              View All Posts &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action or About Section (Example) */}
      <section className="bg-blue-600 text-white py-12 px-4 text-center">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-4">Empowering Fathers, Building Legacies</h2>
          <p className="text-lg mb-6">Join a community dedicated to fearless fatherhood and spiritual strength.</p>
          <Link href="/contact" className="bg-white text-blue-600 px-6 py-3 rounded-full text-lg font-semibold hover:bg-gray-200 transition duration-300">
            Get Involved
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const allPosts = getAllPosts([
    'title',
    'date',
    'coverImage',
    'excerpt',
    'slug',
    'author',
    'readTime',
    'category',
    'tags',
  ]);

  const latestPosts = allPosts.slice(0, 3);

  return {
    props: {
      latestPosts,
    },
    // Removed revalidate: 1 temporarily to force static index.html generation
    // If you ever re-enable ISR for the homepage, uncomment the line below:
    // revalidate: 1,
  };
};

export default Home;