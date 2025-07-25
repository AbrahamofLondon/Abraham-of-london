// pages/books/[slug].tsx
import type { GetStaticProps, GetStaticPaths } from 'next';
import { serialize } from 'next-mdx-remote/serialize';
import Image from 'next/image';
import Layout from '../../components/Layout'; // Assuming your Layout component path
import { getBookBySlug, getAllBooks, BookMeta } from '../../lib/books';
import markdownToHtml from '../../lib/markdownToHtml'; // This utility function is crucial
import Head from 'next/head'; // <--- ADDED THIS IMPORT

interface BookProps {
  book: BookMeta & { content: string }; // 'content' property from serialized markdown
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Use getAllBooks to fetch all book slugs
  const slugs = getAllBooks(['slug']).map(book => book.slug);
  const paths = slugs.map((slug) => ({ params: { slug } }));
  return {
    paths,
    fallback: false, // Set to false to pre-render all paths at build time
  };
};

export const getStaticProps: GetStaticProps<BookProps> = async ({ params }) => {
  const slug = params?.slug as string;
  const book = getBookBySlug(slug, [
    'title',
    'date', // Include date if used, otherwise remove
    'coverImage',
    'excerpt',
    'content', // Request content for serialization
    'buyLink',
    'author', // Include author if used
    // Add any other fields you need here
  ]);

  // Serialize the markdown content to HTML
  // Assuming 'book.content' holds the markdown string
  const contentHtml = await serialize(book.content || '');

  // Ensure all required fields for BookMeta are present
  // This step is important if `getBookBySlug` can return partial data
  const fullBook: BookMeta = {
    slug: book.slug || slug, // Use slug from params if not available in book
    title: book.title || 'Untitled',
    date: book.date || '',
    coverImage: book.coverImage || '',
    excerpt: book.excerpt || '',
    content: book.content || '', // Keep original markdown content if needed, or set to empty if only HTML is desired
    buyLink: book.buyLink || '',
    author: book.author || '',
  };

  return {
    props: {
      book: {
        ...fullBook,
        content: contentHtml.compiledSource, // Pass the serialized HTML content
      },
    },
    revalidate: 1, // Optional: use ISR to re-generate the page periodically
  };
};

const BookPage: React.FC<BookProps> = ({ book }) => {
  return (
    <Layout>
      <Head>
        <title>{book.title} - Abraham of London</title>
        <meta name="description" content={book.excerpt} />
        {/* Add Open Graph/Twitter meta tags here as needed */}
      </Head>

      <article className="container mx-auto px-4 py-8 max-w-3xl">
        {book.coverImage && (
          <div className="mb-8">
            <Image
              src={book.coverImage}
              alt={`Cover image for ${book.title}`}
              width={800} // Adjust based on your design needs
              height={450} // Adjust based on your design needs
              layout="responsive"
              objectFit="cover"
              className="rounded-lg shadow-md"
            />
          </div>
        )}

        <h1 className="text-4xl font-bold text-gray-800 mb-4">{book.title}</h1>
        {book.author && <p className="text-gray-600 text-lg mb-2">By {book.author}</p>}
        {book.date && <p className="text-gray-500 text-sm mb-6">{new Date(book.date).toLocaleDateString()}</p>}

        {/* Display the serialized content */}
        <div className="prose lg:prose-lg mt-8" dangerouslySetInnerHTML={{ __html: book.content }} />

        {book.buyLink && (
          <div className="mt-8 text-center">
            <a
              href={book.buyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-blue-700 transition duration-300"
            >
              Buy Now
            </a>
          </div>
        )}
      </article>
    </Layout>
  );
};

export default BookPage;