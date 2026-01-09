// components/content/DownloadCTA.client.jsx
"use client";

import dynamic from 'next/dynamic';

const DownloadCTA = dynamic(
  () => import('./DownloadCTA'),
  { 
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-gray-700 p-6 bg-gradient-to-br from-gray-900 to-gray-800 animate-pulse">
        <div className="h-4 bg-gray-800 rounded w-1/4 mb-4"></div>
        <div className="h-6 bg-gray-800 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-800 rounded w-full mb-4"></div>
        <div className="h-10 bg-gray-800 rounded w-full"></div>
      </div>
    )
  }
);

export default DownloadCTA;