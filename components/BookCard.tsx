import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface BookCardProps {
  slug: string;
  title: string;
  coverImage?: string;
  excerpt: string;
  buyLink?: string;
  downloadLink?: string;
  downloadEpubLink?: string;
  author?: string;
  genre?: string[];
}

const BookCard: React.FC<BookCardProps> = ({
  slug,
  title,
  coverImage,
  excerpt,
  buyLink,
  downloadLink,
  downloadEpubLink,
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
            fill
            style={{ objectFit: 'cover' }}
            className="transition-transform duration-300 hover:scale-105"
            // Optional: Add sizes prop for responsiveness
            // sizes="(max-width: 768px) 100vw, 33vw"
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
        <div className="mt-auto flex items-center flex-wrap">
          {buyLink && (
            <Link
              href={buyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition duration-300 mr-2 mb-2"
            >
              Buy Now
            </Link>
          )}
          {downloadLink && (
            <Link
              href={downloadLink}
              download
              className="inline-block border border-green-600 text-green-600 px-5 py-2 rounded-full text-sm font-semibold hover:bg-green-50 transition duration-300 mr-2 mb-2"
            >
              Download PDF
            </Link>
          )}
          {downloadEpubLink && (
            <Link
              href={downloadEpubLink}
              download
              className="inline-block border border-purple-600 text-purple-600 px-5 py-2 rounded-full text-sm font-semibold hover:bg-purple-50 transition duration-300 mr-2 mb-2"
            >
              Download EPUB
            </Link>
          )}
          <Link
            href={`/books/${slug}`}
            className="inline-block border border-blue-600 text-blue-600 px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-50 transition duration-300 mb-2"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookCard;