import { safeArraySlice } from "@/lib/utils/safe";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface RelatedShort {
  id: string;
  title: string;
  excerpt: string;
  duration: string;
  category: string;
  viewCount: number;
  image: string;
  slug: string;
}

interface RelatedShortsProps {
  shorts: RelatedShort[];
  currentShortId: string;
}

const RelatedShorts: React.FC<RelatedShortsProps> = ({ shorts, currentShortId }) => {
  const filteredShorts = shorts
    .filter(short => short.id !== currentShortId)
    safeArraySlice(..., 0, 4);

  if (filteredShorts.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-2xl p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">More to Watch</h2>
          <p className="text-gray-600">Continue your learning journey</p>
        </div>
        <Link
          href="/shorts"
          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-2"
        >
          <span>View All Shorts</span>
          <ArrowIcon className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredShorts.map((short) => (
          <Link key={short.id} href={`/shorts/${short.slug}`}>
            <div className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer">
              <div className="relative aspect-video">
                <Image
                  src={short.image}
                  alt={short.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                <div className="absolute bottom-3 left-3">
                  <span className="px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold rounded">
                    {short.duration}
                  </span>
                </div>
                
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded">
                    {short.category}
                  </span>
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                    <PlayIcon className="w-6 h-6 text-gray-900 ml-0.5" />
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {short.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {short.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <EyeIcon className="w-4 h-4" />
                    <span>{short.viewCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-blue-600 font-medium">
                    <span>Watch</span>
                    <ArrowSmallRightIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
  </svg>
);

const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

export default RelatedShorts;
