import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface RelatedDownload {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'template' | 'checklist' | 'worksheet';
  downloads: number;
  size: string;
  image: string;
  slug: string;
  tags: string[];
}

interface RelatedDownloadsProps {
  downloads: RelatedDownload[];
  currentDownloadId: string;
}

const RelatedDownloads: React.FC<RelatedDownloadsProps> = ({ downloads, currentDownloadId }) => {
  const filteredDownloads = downloads
    .filter(download => download.id !== currentDownloadId)
    .slice(0, 4);

  const typeColors = {
    pdf: 'bg-red-100 text-red-800',
    template: 'bg-blue-100 text-blue-800',
    checklist: 'bg-green-100 text-green-800',
    worksheet: 'bg-yellow-100 text-yellow-800',
  };

  const typeIcons = {
    pdf: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    template: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    checklist: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    worksheet: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  };

  return (
    <div className="bg-gray-50 rounded-2xl p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">More Free Downloads</h2>
          <p className="text-gray-600">Expand your toolkit with these resources</p>
        </div>
        <Link
          href="/downloads"
          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-2"
        >
          <span>View All Downloads</span>
          <ArrowIcon className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredDownloads.map((download) => (
          <Link key={download.id} href={`/downloads/${download.slug}`}>
            <div className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer">
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                {download.image ? (
                  <Image
                    src={download.image}
                    alt={download.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={typeIcons[download.type]} />
                    </svg>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${typeColors[download.type]}`}>
                    {download.type.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {download.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {download.description}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <DownloadIcon className="w-4 h-4" />
                      <span>{download.downloads.toLocaleString()}</span>
                    </div>
                    <div>{download.size}</div>
                  </div>
                  <div className="flex items-center text-blue-600 font-medium">
                    <span>Download</span>
                    <ArrowSmallRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
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

const ArrowSmallRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

export default RelatedDownloads;
