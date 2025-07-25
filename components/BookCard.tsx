// components/BookCard.tsx
import Image from 'next/image';
import Link from 'next/link'; // Import Link for navigation

interface BookCardProps {
  book: {
    slug: string;
    title: string;
    coverImage: string; // This will hold the path from MDX
    excerpt: string;
    // You might have other properties like 'author', 'genre', 'buyLink' etc.
    // Ensure these are also defined in the interface if you plan to display them.
  };
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {
  return (
    // Wrap the entire card in a Link component to make it clickable
    <Link href={`/books/${book.slug}`} passHref>
      {/* Use an anchor tag inside Link for proper semantics and styling */}
      <a className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out cursor-pointer">
        {book.coverImage && (
          <div className="relative w-full" style={{ paddingBottom: '150%' }}> {/* Maintain 2:3 aspect ratio */}
            <Image
              src={book.coverImage} // This uses the path from your MDX (e.g., /assets/images/fathering-without-fear.webp)
              alt={book.title}
              layout="fill" // Fill the parent div
              objectFit="cover" // Cover the area, cropping if necessary
              className="absolute inset-0" // Ensure image fills the div
            />
          </div>
        )}

        <div className="p-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 leading-tight">
            {book.title}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-3"> {/* Limit excerpt to 3 lines */}
            {book.excerpt}
          </p>
          {/* You could add more book details here, e.g., author, genre, buy button */}
          {/* Example:
          <p className="text-gray-500 text-xs mb-2">By {book.author}</p>
          {book.buyLink && (
            <a
              href={book.buyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              onClick={(e) => e.stopPropagation()} // Prevent card link from triggering when clicking buy button
            >
              Buy Now
            </a>
          )}
          */}
          <span className="text-blue-600 hover:underline text-sm font-medium">Read More &rarr;</span>
        </div>
      </a>
    </Link>
  );
};

export default BookCard;