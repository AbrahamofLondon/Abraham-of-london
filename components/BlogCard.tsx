// components/BlogCard.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BlogCardProps {
  slug: string; // <--- THIS LINE IS CRUCIAL AND MUST BE PRESENT
  title: string;
  date: string;
  coverImage: string;
  excerpt: string;
  author: string;
  readTime?: string; // Optional
  category?: string; // Optional
  tags?: string[]; // Optional
}

const BlogCard: React.FC<BlogCardProps> = ({
  slug,
  title,
  date,
  coverImage,
  excerpt,
  author,
  readTime,
  category,
  tags,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
      {coverImage && (
        <div className="relative w-full h-48 sm:h-56 lg:h-64">
          <Image
            src={coverImage}
            alt={title}
            fill
            style={{ objectFit: 'cover' }}
            className="transition-transform duration-300 hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <div className="p-6 flex flex-col flex-grow">
        {category && (
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2">
            {category}
          </span>
        )}
        <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
          <Link href={`/blog/${slug}`} className="hover:text-blue-600 transition-colors duration-300">
            {title}
          </Link>
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{excerpt}</p>
        <div className="mt-auto flex items-center justify-between text-gray-500 text-xs">
          <div>
            <span>By {author}</span>
            <span className="mx-1">•</span>
            <span>{new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          {readTime && <span>{readTime}</span>}
        </div>
        {tags && tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span key={tag} className="inline-block bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogCard;