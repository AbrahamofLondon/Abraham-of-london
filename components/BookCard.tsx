// components/BookCard.tsx
import React from 'react';
import Link from 'next/link';

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
    <article className="border rounded-lg shadow-sm overflow-hidden bg-warmWhite transition hover:shadow-md">
      {coverImage && (
        <img
          src={coverImage}
          alt={`Cover of ${title}`}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4 space-y-2">
        <h3 className="text-xl font-display font-semibold text-primary leading-snug">
          {title}
        </h3>
        <p className="text-sm text-charcoal font-body">{excerpt}</p>
        <div className="text-xs text-softGrey font-body">By {author}</div>
        <Link
          href={`/books/${slug}`}
          className="inline-block text-accent hover:underline text-sm font-medium"
        >
          Read More
        </Link>
      </div>
    </article>
  );
};

export default BookCard; // This is the default export