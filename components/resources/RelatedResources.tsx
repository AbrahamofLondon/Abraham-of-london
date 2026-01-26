import { safeArraySlice } from "@/lib/utils/safe";
import React from 'react';
import ResourceCard from './ResourceCard';
import Link from 'next/link';

interface RelatedResource {
  id: string;
  title: string;
  description: string;
  type: 'ebook' | 'whitepaper' | 'template' | 'guide' | 'toolkit';
  downloadCount: number;
  image: string;
  slug: string;
  tags?: string[];
}

interface RelatedResourcesProps {
  resources: RelatedResource[];
  currentResourceId: string;
}

const RelatedResources: React.FC<RelatedResourcesProps> = ({ 
  resources, 
  currentResourceId 
}) => {
  const filteredResources = safeArraySlice(
  resources.filter((r) => r.id !== currentResourceId),
  0,
  3
);

  if (filteredResources.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-2xl p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">More Resources You'll Love</h2>
          <p className="text-gray-600">Discover other valuable materials from our collection</p>
        </div>
        <Link
          href="/resources"
          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-2"
        >
          <span>View All Resources</span>
          <ArrowIcon className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredResources.map((resource) => (
          <ResourceCard key={resource.id} {...resource} />
        ))}
      </div>
    </div>
  );
};

const ArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

export default RelatedResources;
