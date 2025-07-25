// components/BookCard.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Define the interface for BookCard props
export interface BookCardProps { // Exported for clarity, though not strictly needed here if only used internally
  slug: string;
  title: string;
  coverImage: string;
  excerpt: string;
  buyLink?: string; // <--- This MUST be optional!
  author?: string; // Optional
  genre?: string[]; // Optional
}

const BookCard: React.FC<BookCardProps> = ({
  slug,
  title,
  coverImage,
  excerpt,
  buyLink,
  author,
  genre,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
      <div className="relative w-full h-64 overflow-hidden">
        <Image
          src={coverImage}
          alt={title}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 hover:scale-105"
        />
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        {author && <p className="text-gray-600 text-sm mb-2">By {author}</p>}
        <p className="text-gray-700 text-base mb-4 flex-grow">{excerpt}</p>
        <div className="mt-auto">
          {buyLink && ( // Conditionally render the button if buyLink exists
            <Link href={buyLink} passHref>
              <a target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition duration-300 mr-2">
                Buy Now
              </a>
            </Link>
          )}
          <Link href={`/books/${slug}`} passHref>
            <a className="inline-block border border-blue-600 text-blue-600 px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-50 transition duration-300">
              Details
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookCard;