// components/BlogCard.tsx
import { BlogCard } from '../components/BlogCard';

interface BlogCardProps {
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  category: string;
  author: string;
  readTime: string;
  slug: string;
}

export const BlogCard: React.FC<BlogCardProps> = ({
  title,
  date,
  excerpt,
  coverImage,
  category,
  author,
  readTime,
  slug
}) => {
  return (
    <div className="border rounded-lg shadow-sm overflow-hidden">
      {coverImage && <img src={coverImage} alt={title} className="w-full h-48 object-cover" />}
      <div className="p-4">
        <span className="text-xs text-gray-500">{category} • {date}</span>
        <h3 className="text-xl font-bold mt-2 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-3">{excerpt}</p>
        <div className="flex justify-between text-xs text-gray-500">
          <span>By {author}</span>
          <span>{readTime}</span>
        </div>
        <a href={`/blog/${slug`} className="text-blue-600 text-sm mt-2 inline-block">Read More</a>
      </div>
    </div>
  );
};

// components/BookCard.tsx
import React from 'react';

interface BookCardProps {
  title: string;
  coverImage: string;
  author: string;
  slug: string;
  excerpt: string;
}

export const BookCard: React.FC<BookCardProps> = ({
  title,
  coverImage,
  author,
  slug,
  excerpt
}) => {
  return (
    <div className="border rounded-lg shadow-md p-4">
      {coverImage && <img src={coverImage} alt={title} className="w-full h-60 object-cover mb-4" />}
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-2">{excerpt}</p>
      <div className="text-xs text-gray-500 mb-2">By {author}</div>
      <a href={/books/${slug}} className="text-blue-600 text-sm">View Book</a>
    </div>
  );
};