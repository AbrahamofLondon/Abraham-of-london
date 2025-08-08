// components/BlogPostCard.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export interface BlogPostCardProps {
  slug: string;
  title: string;
  date: string;
  excerpt?: string; // Corrected: Made optional to fix the type error
  coverImage?: string; // Corrected: Made optional
  category?: string;
  readTime?: string;
  author?: string;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({
  slug,
  title,
  date,
  excerpt,
  coverImage,
  category,
  readTime = '5 min read',
  author = 'Abraham Adaramola'
}) => {
  return (
    <motion.article
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/blog/${slug}`}>
        <div className="cursor-pointer">
          {coverImage && (
            <div className="relative h-48 w-full">
              <Image
                src={coverImage}
                alt={title}
                fill
                className="object-cover"
              />
            </div>
          )}
          
          <div className="p-6">
            {category && (
              <div className="mb-3">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                  {category}
                </span>
              </div>
            )}
            
            <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
              {title}
            </h3>
            
            {/* Added a check for 'excerpt' before rendering */}
            {excerpt && (
              <p className="text-gray-600 mb-4 line-clamp-3">
                {excerpt}
              </p>
            )}
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <span>{author}</span>
                <span>•</span>
                <span>{readTime}</span>
              </div>
              <time dateTime={date}>
                {new Date(date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};

export default BlogPostCard;