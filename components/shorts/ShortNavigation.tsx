'use client';

import React from 'react';
import Link from 'next/link';

interface ShortNavigationProps {
  previousShort?: {
    id: string;
    title: string;
    slug: string;
  };
  nextShort?: {
    id: string;
    title: string;
    slug: string;
  };
  playlistId?: string;
  playlistTitle?: string;
}

const ShortNavigation: React.FC<ShortNavigationProps> = ({
  previousShort,
  nextShort,
  playlistId,
  playlistTitle,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Previous */}
        <div>
          {previousShort ? (
            <Link href={`/shorts/${previousShort.slug}`}>
              <div className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer">
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                  <ArrowLeftIcon className="w-4 h-4 group-hover:text-blue-600" />
                  <span className="group-hover:text-blue-600">Previous</span>
                </div>
                <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2">
                  {previousShort.title}
                </h4>
              </div>
            </Link>
          ) : (
            <div className="p-4 border border-gray-200 rounded-lg opacity-50">
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Previous</span>
              </div>
              <h4 className="font-semibold text-gray-500">No previous short</h4>
            </div>
          )}
        </div>

        {/* Playlist */}
        {playlistId && (
          <div className="text-center">
            <Link href={`/playlists/${playlistId}`}>
              <div className="group p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all cursor-pointer">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-2">
                  <PlaylistIcon className="w-4 h-4 group-hover:text-purple-600" />
                  <span className="group-hover:text-purple-600">Playlist</span>
                </div>
                <h4 className="font-semibold text-gray-900 group-hover:text-purple-600">
                  {playlistTitle || 'View Playlist'}
                </h4>
              </div>
            </Link>
          </div>
        )}

        {/* Next */}
        <div className="text-right">
          {nextShort ? (
            <Link href={`/shorts/${nextShort.slug}`}>
              <div className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer">
                <div className="flex items-center justify-end space-x-2 text-sm text-gray-500 mb-2">
                  <span className="group-hover:text-blue-600">Next</span>
                  <ArrowRightIcon className="w-4 h-4 group-hover:text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2">
                  {nextShort.title}
                </h4>
              </div>
            </Link>
          ) : (
            <div className="p-4 border border-gray-200 rounded-lg opacity-50">
              <div className="flex items-center justify-end space-x-2 text-sm text-gray-500 mb-2">
                <span>Next</span>
                <ArrowRightIcon className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-gray-500">No next short</h4>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-center">
          <Link
            href="/shorts"
            className="text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-2"
          >
            <GridIcon className="w-4 h-4" />
            <span>Browse All Shorts</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const PlaylistIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const GridIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

export default ShortNavigation;
