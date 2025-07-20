// components/BookCard.tsx
import React from 'react';

interface BookCardProps {
  title: string;
  coverImage: string;
  author: string;
  slug: string;
  excerpt: string;
}

const BookCard: React.FC<BookCardProps> = ({
  title,
  coverImage,
  author,
  slug,
  excerpt,
}) => {
  return (
    <div className="border rounded-lg shadow-sm overflow-hidden">
      {coverImage && (
        <img
          src={coverImage}
          alt={title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-2">{excerpt}</p>
        <div className="text-xs text-gray-500 mb-2">By {author}</div>
        <a
          href={`/books/${slug}`}
          className="text-blue-600 text-sm mt-2 inline-block"
        >
          View Book
        </a>
      </div>
    </div>
  );
};

export default BookCard;