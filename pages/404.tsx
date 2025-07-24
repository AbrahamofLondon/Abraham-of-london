// pages/404.tsx
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout'; // Assuming you have a Layout component

const Custom404: React.FC = () => {
  return (
    <Layout>
      <Head>
        <title>404 - Page Not Found | Abraham of London</title>
        <meta name="description" content="The page you are looking for does not exist." />
        {/* Add any other specific meta tags for your 404 page */}
      </Head>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center py-10 px-4 bg-lightGrey">
        <h1 className="text-6xl font-display font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-charcoal mb-6">Page Not Found</h2>
        <p className="text-md text-softGrey mb-8 max-w-lg">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-primary text-cream font-bold rounded-md hover:bg-gold transition duration-300"
        >
          Go Back Home
        </Link>
      </div>
    </Layout>
  );
};

export default Custom404;