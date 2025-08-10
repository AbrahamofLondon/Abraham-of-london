import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';

export default function NotFound() {
  return (
    <Layout>
      <Head>
        <title>Page Not Found | Abraham of London</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="container px-4 py-20 text-center">
        <h1 className="font-serif text-4xl text-forest mb-3">Page Not Found</h1>
        <p className="text-deepCharcoal/80 mb-6">
          Sorry, the page you’re looking for doesn’t exist.
        </p>
        <Link href="/" className="text-forest underline underline-offset-4 hover:text-softGold">
          ← Go back home
        </Link>
      </main>
    </Layout>
  );
}
