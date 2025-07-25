// pages/books/[slug].tsx
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Layout from '../../components/Layout';
import { getBookBySlug, getBookSlugs, BookMeta } from '../../lib/books'; // Ensure correct import for functions

interface BookPageProps {
  book: BookMeta & { content: any }; // Include content in the type
}

// MDX components if you have any custom ones (e.g., custom images, code blocks)
const components = {
  // You can add custom components here like:
  // img: (props: any) => <Image {...props} alt={props.alt || ''} />,
  // a: (props: any) => <Link href={props.href}>{props.children}</Link>,
};

const BookPage: React.FC<BookPageProps> = ({ book }) => {
  if (!book) {
    return <Layout><div>Book not found.</div></Layout>;
  }

  const { title, coverImage, excerpt, author, genre, buyLink, content } = book;

  return (
    <Layout>
      <Head>
        <title>{title} - Abraham of London Books</title>
        <meta name="description" content={excerpt} />
        {/* Open Graph / Twitter meta tags for sharing */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={excerpt} />
        {coverImage && <meta property="og:image" content={coverImage} />}
        <meta property="og:type" content="book" />
        <meta property="og:url" content={`/books/${book.slug}`} />
        <meta name="twitter:card" content="summary_large_image" />
        {coverImage && <meta name="twitter:image" content={coverImage} />}
      </Head>

      <article className="container mx-auto px-4 py-8">
        {coverImage && (
          <div className="relative w-full h-80 md:h-96 lg:h-[500px] mb-8 overflow-hidden rounded-lg shadow-lg">
            <Image
              src={coverImage}
              alt={title}
              fill
              style={{ objectFit: 'cover' }}
              priority // Prioritize loading for LCP
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            />
          </div>
        )}

        <header className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            {title}
          </h1>
          <div className="text-gray-600 text-sm flex justify-center items-center flex-wrap">
            <span>By {author}</span>
            {genre && (
              <>
                <span className="mx-2">•</span>
                <span>Genre: {genre}</span>
              </>
            )}
          </div>
          {buyLink && (
            <div className="mt-6">
              <Link
                href={buyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-blue-700 transition duration-300 shadow-md"
              >
                Buy Now
              </Link>
            </div>
          )}
        </header>

        <section className="prose prose-lg mx-auto text-gray-800 leading-relaxed max-w-3xl">
          <MDXRemote {...content} components={components} />
        </section>
      </article>
    </Layout>
  );
};

// Generates paths for all book pages based on their slugs
export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getBookSlugs(); // This function should now use the correct 'books' directory
  const paths = slugs.map((slug) => ({
    params: { slug },
  }));

  return {
    paths,
    fallback: false, // Set to 'blocking' or true if you want to use fallback pages
  };
};

// Fetches data for a specific book based on its slug
export const getStaticProps: GetStaticProps<BookPageProps> = async ({ params }) => {
  const slug = params?.slug as string;
  const book = getBookBySlug(slug, ['title', 'coverImage', 'excerpt', 'author', 'genre', 'buyLink', 'content']);

  // Serialize MDX content for rendering
  const mdxSource = await serialize(book.content);

  return {
    props: {
      book: {
        ...book,
        content: mdxSource,
      },
    },
    revalidate: 1, // Re-generate the page at most once every 1 second
  };
};

export default BookPage;