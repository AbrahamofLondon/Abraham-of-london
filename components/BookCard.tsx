import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface BookCardProps {
  slug: string;
  title: string;
  coverImage?: string;
  excerpt?: string; // Corrected line
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
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col h-full">
      <Link href={`/books/${slug}`} passHref className="relative w-full h-64 block overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={`Cover of ${title}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            style={{ objectFit: 'cover' }}
            className="hover:scale-105 transition-transform duration-300 ease-in-out"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-sm">
            No Cover Image
          </div>
        )}
      </Link>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h3>
        {author && <p className="text-sm text-gray-600 mb-1">By {author}</p>}
        {genre && genre.length > 0 && (
          <p className="text-xs text-gray-500 italic mb-2">Genre: {genre.join(', ')}</p>
        )}
        {excerpt && <p className="text-gray-700 text-base mb-4 line-clamp-3">{excerpt}</p>}
        <div className="mt-auto space-y-2">
          {buyLink && (
            <Link
              href={buyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-full font-medium transition duration-300"
            >
              Buy Now
            </Link>
          )}
          {downloadLink && (
            <Link
              href={downloadLink}
              download
              className="inline-block w-full text-center border border-green-600 text-green-700 hover:bg-green-50 py-2 rounded-full font-medium transition duration-300"
            >
              Download PDF
            </Link>
          )}
          {downloadEpubLink && (
            <Link
              href={downloadEpubLink}
              download
              className="inline-block w-full text-center border border-purple-600 text-purple-700 hover:bg-purple-50 py-2 rounded-full font-medium transition duration-300"
            >
              Download EPUB
            </Link>
          )}
          <Link
            href={`/books/${slug}`}
            className="inline-block w-full text-center border border-blue-600 text-blue-600 hover:bg-blue-50 py-2 rounded-full font-medium transition duration-300"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookCard;