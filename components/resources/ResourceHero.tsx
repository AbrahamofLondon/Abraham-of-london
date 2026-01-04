import React from 'react';
import Image from 'next/image';

interface ResourceHeroProps {
  title: string;
  subtitle?: string;
  description: string;
  coverImage: string;
  type: 'ebook' | 'whitepaper' | 'template' | 'guide' | 'toolkit';
  downloadCount: number;
  rating?: number;
}

const ResourceHero: React.FC<ResourceHeroProps> = ({
  title,
  subtitle,
  description,
  coverImage,
  type,
  downloadCount,
  rating,
}) => {
  const typeLabels = {
    ebook: 'eBook',
    whitepaper: 'Whitepaper',
    template: 'Template',
    guide: 'Guide',
    toolkit: 'Toolkit',
  };

  return (
    <div className="relative bg-gradient-to-br from-gray-900 to-blue-900 text-white overflow-hidden">
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
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center space-x-4 mb-6">
              <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-semibold">
                {typeLabels[type]}
              </span>
              <div className="flex items-center space-x-2 text-sm">
                <DownloadIcon className="w-4 h-4" />
                <span>{downloadCount.toLocaleString()} downloads</span>
              </div>
              {rating && (
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`}
                    />
                  ))}
                  <span className="ml-1">{rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              {title}
            </h1>
            
            {subtitle && (
              <h2 className="text-2xl md:text-3xl font-light text-blue-200 mb-6">
                {subtitle}
              </h2>
            )}
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-3xl">
              {description}
            </p>
            
            <div className="flex flex-wrap gap-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2">
                <DownloadIcon className="w-5 h-5" />
                <span>Download Now</span>
              </button>
              <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-semibold transition-colors backdrop-blur-sm">
                Preview Sample
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
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
            
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute -top-6 -left-6 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default ResourceHero;