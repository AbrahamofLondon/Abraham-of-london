// components/BookCard.tsx
import React from 'react';
import Link from 'next/link';

interface BookCardProps {
  title: string;
  date?: string; // Made optional
  excerpt: string;
  coverImage: string;
  category?: string; // Made optional
  author: string;
  readTime?: string; // Made optional
  slug: string;
}

const BookCard: React.FC<BookCardProps> = ({
  title,
  date,
  excerpt,
  coverImage,
  category,
  author,
  readTime,
  slug,
}) => {
  return (
    <article className="border rounded-lg shadow-sm overflow-hidden bg-warmWhite transition hover:shadow-md">
      {coverImage && (
        <img
          src={coverImage}
          alt={title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4 space-y-2">
        {/* Conditional rendering for category and date */}
        {category && date && (
          <p className="text-xs text-softGrey uppercase tracking-wide font-medium">
            {category} • {date}
          </p>
        )}
        <h3 className="text-xl font-display font-semibold text-primary leading-snug">
          {title}
        </h3>
        <p className="text-sm text-charcoal font-body">{excerpt}</p>
        <div className="flex justify-between items-center text-xs text-softGrey font-body pt-2 border-t border-softGrey/30">
          <span>By {author}</span>
          {/* Conditional rendering for readTime */}
          {readTime && <span>{readTime}</span>}
        </div>
        <Link
          href={`/books/${slug}`}
          className="inline-block mt-3 text-sm text-primary underline font-body hover:text-gold"
        >
          Read Book
        </Link>
      </div>
    </article>
  );
};

export default BookCard;