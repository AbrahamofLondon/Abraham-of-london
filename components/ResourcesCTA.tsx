// components/ResourcesCTA.tsx
import React from 'react';
import Link from 'next/link';

interface ResourcesCTAProps {
  preset?: string;
  className?: string;
}

export default function ResourcesCTA({ preset, className = '' }: ResourcesCTAProps) {
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}>
      <h3 className="font-semibold text-lg mb-2">Explore More Resources</h3>
      <p className="text-gray-600 mb-4">
        Discover additional guides, frameworks, and tools to support your journey.
      </p>
      <Link 
        href="/resources" 
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        View All Resources
      </Link>
    </div>
  );
}