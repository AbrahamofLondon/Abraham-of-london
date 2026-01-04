import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface RelatedPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  image: string;
  slug: string;
  tags: string[];
}

interface RelatedPostsProps {
  currentPostSlug: string;
}

const RelatedPosts: React.FC<RelatedPostsProps> = ({ currentPostSlug }) => {
  // In a real app, you would fetch related posts based on currentPostSlug
  const relatedPosts: RelatedPost[] = [
    {
      id: '1',
      title: 'The Future of Digital Transformation',
      excerpt: 'Exploring how emerging technologies are reshaping businesses and creating new opportunities.',
      date: '2024-01-15',
      readTime: '6 min',
      image: '/assets/images/blog-future.jpg',
      slug: 'future-of-digital-transformation',
      tags: ['Technology', 'Business'],
    },
    {
      id: '2',
      title: 'Building Sustainable Business Models',
      excerpt: 'Strategies for creating businesses that thrive while positively impacting society and environment.',
      date: '2024-01-10',
      readTime: '8 min',
      image: '/assets/images/blog-sustainable.jpg',
      slug: 'sustainable-business-models',
      tags: ['Business', 'Sustainability'],
    },
  ];

  return (
    <div className="bg-gray-50 rounded-2xl p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Continue Reading</h2>
      <p className="text-gray-600 mb-8">More articles you might find interesting</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {relatedPosts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`}>
            <div className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer">
              <div className="relative h-48">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded">
                    {post.tags[0]}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  <span>{post.date}</span>
                  <span className="mx-2">•</span>
                  <ClockIcon className="w-4 h-4 mr-1" />
                  <span>{post.readTime} read</span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center text-blue-600 font-semibold">
                  <span>Read Article</span>
                  <ArrowIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        ))}
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

const ArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

export default RelatedPosts;