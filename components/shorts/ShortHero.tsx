// components/shorts/ShortHero.tsx
'use client';

import React from 'react';

interface ShortHeroProps {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category?: string[];
}

const ShortHero: React.FC<ShortHeroProps> = ({
  title,
  excerpt,
  author,
  date,
  readTime,
  category = [],
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Category Tags */}
          {category.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {category.map((cat, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-xs font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-500 rounded-full"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
          
          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            {title}
          </h1>
          
          {/* Excerpt */}
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            {excerpt}
          </p>
          
          {/* Meta Information */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 pt-6 border-t border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold">
                  {author.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white">{author}</p>
                  <p className="text-sm text-gray-400">Author</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-gray-400">Published</p>
                <p className="font-medium text-white">{date}</p>
              </div>
              
              <div>
                <p className="text-gray-400">Reading Time</p>
                <p className="font-medium text-white">{readTime}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-full -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-amber-500/3 to-transparent rounded-full translate-y-48 -translate-x-48" />
    </div>
  );
};

export default ShortHero;
