// pages/books/[slug].tsx
import Head from 'next/head';
import Image from 'next/image';
import Layout from '../../components/Layout'; // Assuming your Layout component path
import { getBookBySlug, getAllBooks } from '../../lib/books'; // These utility functions are crucial
import markdownToHtml from '../../lib/markdownToHtml'; // This utility function is crucial

interface BookProps {
  book: {
    slug: string;
    title: string;
    coverImage: string;
    excerpt: string;
    content: string; // Full MDX content parsed to HTML
    buyLink?: string; // Optional external buy link
    // Add other properties from your MDX frontmatter here if you want to display them
    // For example: author?: string; genre?: string[];
  };
}

const BookDetail: React.FC<BookProps> = ({ book }) => {
  // If no book data is found, this likely means getStaticProps didn't find a matching slug
  // For production, you might want a more elaborate 404 or a redirect.
  if (!book) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Book Not Found</h1>
          <p className="text-gray-700 text-lg">
            Oops! The book you're looking for doesn't exist.
          </p>
          <a href="/books" className="mt-8 inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">
            Go to All Books
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{book.title} | Abraham of London</title>
        <meta name="description" content={book.excerpt} />
        {/* You can add specific Open Graph/Twitter meta tags here for each book
            This will override the default ones in Layout.tsx for this specific page. */}
        {book.coverImage && <meta property="og:image" content={book.coverImage} />}
        {book.coverImage && <meta name="twitter:image" content={book.coverImage} />}
        <meta property="og:title" content={book.title} />
        <meta name="twitter:title" content={book.title} />
        <meta property="og:description" content={book.excerpt} />
        <meta name="twitter:description" content={book.excerpt} />
        {/* Canonical URL to prevent duplicate content issues if different paths lead here */}
        <link rel="canonical" href={`https://abrahamoflondon.org/books/${book.slug}`} />
      </Head>

      <article className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Book Cover Image */}
        {book.coverImage && (
          <div className="mb-8 relative w-full" style={{ paddingBottom: '150%' }}> {/* Maintains a 2:3 aspect ratio */}
            <Image
              src={book.coverImage} // This will be the path from your MDX, e.g., /assets/images/fathering-without-fear-teaser.jpg
              alt={book.title}
              layout="fill"
              objectFit="contain" // Use 'contain' to ensure the entire cover fits within the container
              className="rounded-lg shadow-lg"
              priority // Prioritize loading for the main book image
            />
          </div>
        )}

        <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">{book.title}</h1>
        <p className="text-gray-700 text-lg mb-6 text-center">{book.excerpt}</p>

        {/* Download Section - Links to files in public/downloads/ */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {/* Link to PDF download */}
          {/* Ensure 'fathering-without-fear.pdf' exists in public/downloads/ */}
          <a
            href="/downloads/fathering-without-fear.pdf"
            download="Fathering Without Fear.pdf" // Prompts browser to download with this filename
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Download PDF
          </a>

          {/* Link to EPUB download */}
          {/* Ensure 'fathering-without-fear.epub' exists in public/downloads/ */}
          <a
            href="/downloads/fathering-without-fear.epub"
            download="Fathering Without Fear.epub" // Prompts browser to download with this filename
            className="inline-flex items-center px-6 py-3 border border-green-600 text-base font-medium rounded-md text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Download EPUB
          </a>

          {/* Optional: External Buy Link (e.g., Amazon, Gumroad) from MDX frontmatter */}
          {book.buyLink && (
            <a
              href={book.buyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Buy on Amazon/Store
            </a>
          )}
        </div>

        {/* Book Content (parsed from MDX) */}
        {/* Ensure you have @tailwindcss/typography plugin installed and configured in tailwind.config.js
            for the 'prose' classes to apply proper styling to markdown content. */}
        <div className="prose lg:prose-lg max-w-none mx-auto" dangerouslySetInnerHTML={{ __html: book.content }} />
      </article>
    </Layout>
  );
};

export default BookDetail;

// getStaticProps is used to fetch data at build time for static pages.
// It runs on the server side.
export async function getStaticProps({ params }: { params: { slug: string } }) {
  // Fetch book data by slug. Make sure your getBookBySlug function is implemented
  // to read the MDX file and return its frontmatter and content.
  const book = getBookBySlug(params.slug, [
    'slug',
    'title',
    'coverImage',
    'excerpt',
    'content',
    'buyLink',
    // Add any other frontmatter fields you need here
  ]);

  // Convert markdown content to HTML. Make sure markdownToHtml function is implemented.
  const content = await markdownToHtml(book?.content || '');

  return {
    props: {
      book: {
        ...book,
        content,
      },
    },
    revalidate: 1, // Optional: ISR (Incremental Static Regeneration)
                  // Re-generates the page at most every 1 second if a request comes in.
                  // Remove this line if you want purely static pages that only rebuild on redeploy.
  };
}

// getStaticPaths is used to pre-render all possible paths for dynamic routes.
// It also runs on the server side at build time.
export async function getStaticPaths() {
  // Get all book slugs to generate static pages for each book.
  // Make sure your getAllBooks function is implemented to return slugs of all book MDX files.
  const books = getAllBooks(['slug']);

  return {
    // Map slugs to the 'paths' array expected by Next.js
    paths: books.map((book)