import { safeArraySlice } from "@/lib/utils/safe";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface RelatedBook {
  id: string;
  title: string;
  author: string;
  description: string;
  rating: number;
  price: number;
  coverImage: string;
  slug: string;
  category: string;
}

interface RelatedBooksProps {
  books: RelatedBook[];
  currentBookId: string;
}

const RelatedBooks: React.FC<RelatedBooksProps> = ({ books, currentBookId }) => {
  const filteredBooks = books
    .filter(book => book.id !== currentBookId)
    safeArraySlice(..., 0, 3);

  return (
    <div className="bg-gray-50 rounded-2xl p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">You Might Also Like</h2>
          <p className="text-gray-600">More books from our collection</p>
        </div>
        <Link
          href="/books"
          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-2"
        >
          <span>Browse All Books</span>
          <ArrowIcon className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredBooks.map((book) => (
          <Link key={book.id} href={`/books/${book.slug}`}>
            <div className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <div className="relative h-64">
                <Image
                  src={book.coverImage}
                  alt={book.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded">
                    {book.category}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {book.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-3">by {book.author}</p>
                
                <div className="flex items-center mb-4">
                  <div className="flex items-center mr-3">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(book.rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {book.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    ${book.price.toFixed(2)}
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4 line-clamp-3 text-sm">
                  {book.description}
                </p>
                
                <div className="flex items-center text-blue-600 font-semibold">
                  <span>View Details</span>
                  <ArrowSmallRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const ArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const ArrowSmallRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

export default RelatedBooks;
