import React from 'react';
import Image from 'next/image';

interface CanonHeroProps {
  title: string;
  subtitle?: string;
  description: string;
  coverImage: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
}

const CanonHero: React.FC<CanonHeroProps> = ({
  title,
  subtitle,
  description,
  coverImage,
  category,
  difficulty,
  estimatedHours,
}) => {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  };

  return (
    <div className="relative bg-gradient-to-br from-gray-900 to-purple-900 text-white overflow-hidden">
      <div className="absolute inset-0">
        {coverImage && (
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover opacity-10"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-purple-900/90" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center space-x-4 mb-6">
              <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-semibold">
                {category}
              </span>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${difficultyColors[difficulty]}`}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              {title}
            </h1>
            
            {subtitle && (
              <h2 className="text-2xl md:text-3xl font-light text-purple-200 mb-6">
                {subtitle}
              </h2>
            )}
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-3xl">
              {description}
            </p>
            
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-5 h-5 text-purple-300" />
                <span className="text-lg">{estimatedHours} hours</span>
              </div>
              <div className="flex items-center space-x-2">
                <BookIcon className="w-5 h-5 text-purple-300" />
                <span className="text-lg">Comprehensive Guide</span>
              </div>
              <div className="flex items-center space-x-2">
                <CertificateIcon className="w-5 h-5 text-purple-300" />
                <span className="text-lg">Certificate Available</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2">
                <PlayIcon className="w-5 h-5" />
                <span>Start Learning</span>
              </button>
              <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-semibold transition-colors backdrop-blur-sm">
                Download Syllabus
              </button>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
              {coverImage ? (
                <Image
                  src={coverImage}
                  alt={title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
            
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute -top-6 -left-6 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const CertificateIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default CanonHero;