import Head from 'next/head';
import Image from 'next/image';
import { GetStaticProps } from 'next';

import BookCard from '@/components/BookCard';
import { getAllBooks } from '@/lib/books';
import { Book } from '@/types/book';

interface HomeProps {
  books: Book[];
}

const Home: React.FC<HomeProps> = ({ books }) => {
  return (
    <>
      <Head>
        <title>Abraham of London</title>
        <meta
          name="description"
          content="Author, Fatherhood Advocate, and Mentor. Discover books, thoughts, and resources by Abraham of London."
        />
        <meta property="og:title" content="Abraham of London" />
        <meta
          property="og:description"
          content="Author, Fatherhood Advocate, and Mentor. Discover books, thoughts, and resources by Abraham of London."
        />
        <meta property="og:image" content="/assets/social/og-image.jpg" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Abraham of London" />
        <meta
          name="twitter:description"
          content="Author, Fatherhood Advocate, and Mentor. Discover books, thoughts, and resources by Abraham of London."
        />
        <meta name="twitter:image" content="/assets/social/twitter-image.webp" />
        <link
          rel="preload"
          href="/assets/images/abraham-of-London-banner.webp"
          as="image"
          type="image/webp"
        />
      </Head>

      <main className="max-w-5xl mx-auto px-4">
        {/* Hero Banner */}
        <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] mb-8 rounded-lg overflow-hidden shadow-md">
          <Image
            src="/assets/images/abraham-of-London-banner.webp"
            alt="Hero banner showing Abraham of London’s branding and vision"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw,
                   (max-width: 1200px) 100vw,
                   1200px"
          />
        </div>

        {/* Profile Section */}
        <section className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <Image
            src="/assets/images/profile-portrait.webp"
            alt="Portrait of Abraham of London"
            width={200}
            height={200}
            className="rounded-full shadow-lg object-cover"
            priority
          />
          <div>
            <h1 className="text-3xl font-bold mb-2">Abraham of London</h1>
            <p className="text-lg text-gray-700">
              Author, fatherhood mentor, and social entrepreneur. Sharing
              stories, building legacies, and reclaiming the narrative.
            </p>
          </div>
        </section>

        {/* Books */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <BookCard key={book.slug} {...book} />
          ))}
        </section>
      </main>
    </>
  );
};

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const books = getAllBooks();

  return {
    props: {
      books,
    },
  };
};

export default Home;
