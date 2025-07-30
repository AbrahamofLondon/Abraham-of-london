// components/BookCard.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface BookCardProps {
  slug: string;
  title: string;
  coverImage?: string;
  excerpt: string;
  buyLink?: string;
  downloadLink?: string; // <--- ADD THIS
  author?: string;
  genre?: string[];
}

const BookCard: React.FC<BookCardProps> = ({
  slug,
  title,
  coverImage,
  excerpt,
  buyLink,
  downloadLink, // <--- ADD THIS
  author,
  genre,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
      {coverImage ? (
        <div className="relative w-full h-64 overflow-hidden">
          <Image
            src={coverImage}
            alt={title}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 hover:scale-105"
          />
        </div>
      ) : (
        <div className="relative w-full h-64 flex items-center justify-center bg-gray-200 text-gray-500">
          No Cover Image
        </div>
      )}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        {author && <p className="text-gray-600 text-sm mb-2">By {author}</p>}
        {genre && genre.length > 0 && (
          <p className="text-gray-500 text-xs mb-2">Genre: {genre.join(', ')}</p>
        )}
        <p className="text-gray-700 text-base mb-4 flex-grow">{excerpt}</p>
        <div className="mt-auto flex items-center"> {/* Added flex to align buttons */}
          {buyLink && (
            <Link href={buyLink} passHref>
              <a target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition duration-300 mr-2">
                Buy Now
              </a>
            </Link>
          )}
          {downloadLink && ( // <--- ADD THIS BLOCK FOR DOWNLOADS
            <Link href={downloadLink} passHref>
              <a className="inline-block border border-green-600 text-green-600 px-5 py-2 rounded-full text-sm font-semibold hover:bg-green-50 transition duration-300 mr-2" download> {/* 'download' attribute prompts download */}
                Download PDF
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