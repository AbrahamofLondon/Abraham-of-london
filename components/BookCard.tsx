// components/BookCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import { BookMeta } from '../lib/books'; // Import BookMeta to define the type of 'book'

// Define the properties (props) that BookCard expects
interface BookCardProps {
  book: BookMeta; // The BookCard expects a prop named 'book' which is of type BookMeta
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {
  // Destructure properties directly from the 'book' object
  const { title, coverImage, excerpt, slug, author, buyLink } = book;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg">
      <Link href={`/books/${slug}`} passHref>
        <div className="relative h-64 w-full cursor-pointer">
          {/* Use coverImage directly as it's part of book */}
          {coverImage && (
            <Image
              src={coverImage}
              alt={title}
              fill
              style={{ objectFit: 'cover' }}
              className="transition duration-300 group-hover:opacity-75"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
        </div>
      </Link>
      <div className="p-6">
        <Link href={`/books/${slug}`} passHref>
          <h2 className="text-xl font-semibold text-gray-800 hover:text-blue-600 transition duration-150 ease-in-out cursor-pointer">
            {title}
          </h2>
        </Link>
        <p className="text-gray-600 text-sm mt-2 line-clamp-3">{excerpt}</p>
        <p className="text-gray-500 text-xs mt-2">By {author}</p>
        {buyLink && (
          <a
            href={buyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition duration-150 ease-in-out"
          >
            Buy Now
          </a>
        )}
        <Link href={`/books/${slug}`} passHref>
          <button className="mt-6 ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition duration-150 ease-in-out">
            Read More
          </button>
        </Link>
      </div>
    </div>
  );
};

export default BookCard;