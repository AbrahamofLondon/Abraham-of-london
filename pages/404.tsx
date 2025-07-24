// pages/404.tsx
import Link from 'next/link';
import Layout from '../components/Layout';

export default function Custom404() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <h1 className="text-4xl font-bold mb-6">404 - Page Not Found</h1>
        <p className="text-lg text-gray-600 mb-8">
          The page you’re looking for doesn’t exist.
        </p>
        <Link href="/" className="text-primary underline hover:text-gold">
          Return to Home
        </Link>
      </div>
    </Layout>
  );
}