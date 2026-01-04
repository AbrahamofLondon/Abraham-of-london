import React from 'react';
import Image from 'next/image';

interface BlogHeaderProps {
  title: string;
  author: string | null;
  date: string;
  coverImage: string | null;
  tags: string[];
}

const BlogHeader: React.FC<BlogHeaderProps> = ({
  title,
  author,
  date,
  coverImage,
  tags,
}) => {
  return (
    <div className="relative bg-gradient-to-b from-gray-50 to-white py-12 lg:py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Category/Tags */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          
          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {title}
          </h1>
          
          {/* Metadata */}
          <div className="flex items-center justify-center space-x-6 text-gray-600 mb-8">
            {author && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full" />
                <span className="font-medium">{author}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5" />
              <span>{date}</span>
            </div>
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-5 h-5" />
              <span>5 min read</span>
            </div>
          </div>
        </div>
        
        {/* Cover Image */}
        {coverImage && (
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src={coverImage}
                alt={title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default BlogHeader;