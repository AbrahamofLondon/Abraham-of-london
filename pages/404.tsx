// pages/404.tsx
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found</title>
      </Head>

      <main className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <Image
          src="/assets/images/default-book.jpg"
          alt="404 Not Found"
          width={400}
          height={300}
          className="mb-6"
        />
        <h1 className="text-4xl font-bold mb-2">Page Not Found</h1>
        <p className="text-lg mb-6">Sorry, the page you’re looking for doesn’t exist.</p>
        <Link href="/">
          <a className="text-blue-600 hover:underline text-lg">← Go back home</a>
        </Link>
      </main>
    </>
  );
}
