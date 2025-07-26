// pages/books/[slug].tsx
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Layout from '../../components/Layout';
// Import the new types and functions from lib/books
import { getAllBooks, getBookBySlug, BookMeta, BookWithContent } from '../../lib/books'; 
import Image from 'next/image';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Link from 'next/link';

interface BookPageProps {
  // The 'book' prop passed to the component will have content as MDXRemoteSerializeResult
  book: BookMeta & {
    content: MDXRemoteSerializeResult;
  };
}

// Define custom MDX components if you need them
const components = {
  // For example:
  // h1: (props: any) => <h1 className="text-3xl font-bold my-4" {...props} />,
  // p: (props: any) => <p className="mb-4" {...props} />,
  // img: (props: any) => <img className="my-4 rounded-lg shadow-md" {...props} />,
  // a: (props: any) => <a className="text-blue-600 hover:underline" {...props} />,
};

export default function BookPage({ book }: BookPageProps) {
  const bookUrl = `https://abrahamoflondon.org/books/${book.slug}`; // Adjust base URL if needed

  return (
    <Layout>
      <Head>
        <title>{book.title} | Abraham of London - Books</title>
        <meta name="description" content={book.description} />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={book.title} />
        <meta property="og:description" content={book.description} />
        <meta property="og:url" content={bookUrl} />
        <meta property="og:type" content="book" /> {/* Use 'book' type for Open Graph */}
        {book.image && <meta property="og:image" content={book.image} />}
        {/* Fallback to coverImage if 'image' is not explicitly set for OG */}
        {!book.image && book.coverImage && <meta property="og:image" content={book.coverImage} />}
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={book.title} />
        <meta name="twitter:description" content={book.description} />
        {book.image && <meta name="twitter:image" content={book.image} />}
        {!book.image && book.coverImage && <meta name="twitter:image" content={book.coverImage} />}
        
        {/* Canonical URL */}
        <link rel="canonical" href={bookUrl} />
      </Head>

      <article className="prose lg:prose-xl mx-auto my-8 p-4">
        <h1 className="text-4xl font-bold mb-4">{book.title}</h1>
        {book.author && <p className="text-gray-600 mb-2">By {book.author}</p>}
        {book.genre && book.genre.length > 0 && (
          <p className="text-gray-500 text-sm mb-4">Genre: {book.genre.join(', ')}</p>
        )}

        {book.coverImage && (
          <div className="relative w-full h-72 sm:h-96 md:h-112 my-6 mx-auto rounded-lg overflow-hidden shadow-lg">
            <Image
              src={book.coverImage}
              alt={`Cover image for ${book.title}`}
              layout="fill"
              objectFit="contain" // Use 'contain' for book covers to show full image
              className="bg-gray-100" // Add a background for 'contain'
            />
          </div>
        )}

        {book.buyLink && (
          <div className="mb-8 text-center">
            <Link href={book.buyLink} passHref>
              <a target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-blue-700 transition duration-300 shadow-md">
                Buy Now
              </a>
            </Link>
          </div>
        )}

        <div className="prose max-w-none">
          <MDXRemote {...book.content} components={components} />
        </div>
      </article>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const books = getAllBooks(['slug']);
  const paths = books.map((book) => ({
    params: { slug: book.slug },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  // Assert type to BookWithContent because we are requesting 'content'
  const book = getBookBySlug(slug, [
    'title',
    'date', // If you have a publication date for books
    'slug',
    'author',
    'content', // Requesting content means it WILL be a string here
    'description',
    'coverImage',
    'buyLink',
    'genre',
    'image', // Also request 'image' for SEO
  ]) as BookWithContent;

  const mdxSource = await serialize(book.content, {
    parseFrontmatter: true,
  });

  return {
    props: {
      book: {
        ...book,
        content: mdxSource,
      },
    },
  };
};