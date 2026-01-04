import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ResourceCardProps {
  title: string;
  description: string;
  type: 'ebook' | 'whitepaper' | 'template' | 'guide' | 'toolkit';
  downloadCount: number;
  image: string;
  slug: string;
  isFeatured?: boolean;
  tags?: string[];
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  title,
  description,
  type,
  downloadCount,
  image,
  slug,
  isFeatured = false,
  tags = [],
}) => {
  const typeLabels = {
    ebook: 'eBook',
    whitepaper: 'Whitepaper',
    template: 'Template',
    guide: 'Guide',
    toolkit: 'Toolkit',
  };

  const typeColors = {
    ebook: 'bg-purple-100 text-purple-800',
    whitepaper: 'bg-blue-100 text-blue-800',
    template: 'bg-green-100 text-green-800',
    guide: 'bg-yellow-100 text-yellow-800',
    toolkit: 'bg-red-100 text-red-800',
  };

  return (
    <Link href={`/resources/${slug}`}>
      <div className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
        {isFeatured && (
          <div className="absolute top-4 right-4 z-10">
            <span className="px-3 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded-full">
              Featured
            </span>
          </div>
        )}
        
        <div className="relative h-48 bg-gradient-to-br from-gray-900 to-blue-900">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          <div className="absolute bottom-4 left-4">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${typeColors[type]}`}>
              {typeLabels[type]}
            </span>
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
            {title}
          </h3>
          
          <p className="text-gray-600 mb-4 line-clamp-3">
            {description}
          </p>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  +{tags.length - 3} more
                </span>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center text-sm text-gray-500">
              <DownloadIcon className="w-4 h-4 mr-1" />
              <span>{downloadCount.toLocaleString()} downloads</span>
            </div>
            
            <div className="flex items-center text-blue-600 font-semibold">
              <span>Download</span>
              <ArrowIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

export default ResourceCard;