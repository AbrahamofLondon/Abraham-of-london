// components/downloads/DownloadContent.tsx - COMPLETE FIXED VERSION
import React from 'react'
import { MDXRemote } from 'next-mdx-remote'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// CRITICAL: Dynamically import all components that might have SCSS/CSS
// Use ssr: false to prevent server-side CSS processing
const LegacyCanvasInteractive = dynamic(
  () => import('@/components/downloads/LegacyCanvasInteractive'),
  { 
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-gray-700 p-6 bg-gray-900/50 animate-pulse">
        <div className="h-4 bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="h-40 bg-gray-800 rounded"></div>
      </div>
    )
  }
)

const ProTip = dynamic(
  () => import('@/components/content/ProTip'),
  { 
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-blue-500/20 p-4 bg-blue-500/5 animate-pulse">
        <div className="h-4 bg-gray-800 rounded w-1/4 mb-2"></div>
        <div className="h-3 bg-gray-800 rounded w-full"></div>
      </div>
    )
  }
)

const FeatureGrid = dynamic(
  () => import('@/components/content/FeatureGrid'),
  { 
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-gray-800 rounded"></div>
        ))}
      </div>
    )
  }
)

// CRITICAL: DownloadCTA has SCSS imports, must be client-only
const DownloadCTA = dynamic(
  () => import('@/components/content/DownloadCTA'),
  { 
    ssr: false, // MUST be false to prevent SCSS import on server
    loading: () => (
      <div className="rounded-xl border border-gray-700 p-6 bg-gradient-to-br from-gray-900 to-gray-800 animate-pulse">
        <div className="h-4 bg-gray-800 rounded w-1/4 mb-4"></div>
        <div className="h-6 bg-gray-800 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-800 rounded w-full mb-4"></div>
        <div className="h-10 bg-gray-800 rounded w-full"></div>
      </div>
    )
  }
)

interface DownloadContentProps {
  content: any // MDX content
  frontmatter?: any
}

// Basic components that don't need SCSS/CSS imports
const components = {
  LegacyCanvasInteractive,
  ProTip,
  FeatureGrid,
  DownloadCTA,
  a: (props: any) => <Link {...props} className="text-amber-500 hover:text-amber-400 underline underline-offset-2 transition-colors" />,
  h2: (props: any) => <h2 className="text-2xl font-bold mt-8 mb-4 text-white" {...props} />,
  h3: (props: any) => <h3 className="text-xl font-bold mt-6 mb-3 text-white" {...props} />,
  h4: (props: any) => <h4 className="text-lg font-bold mt-4 mb-2 text-white" {...props} />,
  p: (props: any) => <p className="text-gray-300 mb-4 leading-relaxed" {...props} />,
  ul: (props: any) => <ul className="list-disc pl-5 mb-4 text-gray-300 space-y-2" {...props} />,
  ol: (props: any) => <ol className="list-decimal pl-5 mb-4 text-gray-300 space-y-2" {...props} />,
  li: (props: any) => <li className="mb-1" {...props} />,
  strong: (props: any) => <strong className="font-semibold text-white" {...props} />,
  em: (props: any) => <em className="italic" {...props} />,
  blockquote: (props: any) => (
    <blockquote 
      className="border-l-4 border-amber-500 pl-4 italic my-6 text-gray-400 bg-gray-900/30 py-2 rounded-r-lg"
      {...props} 
    />
  ),
  hr: (props: any) => <hr className="my-8 border-gray-800" {...props} />,
  code: (props: any) => (
    <code 
      className="px-2 py-1 bg-gray-900 text-amber-300 rounded text-sm font-mono"
      {...props} 
    />
  ),
  pre: (props: any) => (
    <pre 
      className="my-6 p-4 bg-gray-900 rounded-lg overflow-x-auto border border-gray-800"
      {...props} 
    />
  ),
  table: (props: any) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full divide-y divide-gray-800" {...props} />
    </div>
  ),
  th: (props: any) => (
    <th 
      className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider bg-gray-900"
      {...props} 
    />
  ),
  td: (props: any) => (
    <td 
      className="px-4 py-3 text-sm text-gray-300 border-t border-gray-800"
      {...props} 
    />
  ),
  // You can add more custom components as needed
  DownloadCTA: (props: any) => <DownloadCTA {...props} />,
  ProTip: (props: any) => <ProTip {...props} />,
  FeatureGrid: (props: any) => <FeatureGrid {...props} />,
  LegacyCanvasInteractive: (props: any) => <LegacyCanvasInteractive {...props} />,
}

const DownloadContent: React.FC<DownloadContentProps> = ({ content, frontmatter }) => {
  if (!content) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-200 mb-2">Content Loading</h3>
          <p className="text-yellow-300">The download content is being loaded...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Main Content Area */}
      <div className="prose prose-invert prose-lg max-w-none">
        <MDXRemote {...content} components={components} />
      </div>
      
      {/* Related Downloads Section */}
      {frontmatter?.relatedDownloads && frontmatter.relatedDownloads.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-800">
          <h3 className="text-2xl font-bold mb-6 text-white">Related Downloads</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {frontmatter.relatedDownloads.map((download: string, index: number) => (
              <Link
                key={index}
                href={`/downloads/${download}`}
                className="block p-4 rounded-lg border border-gray-800 hover:border-amber-500/30 hover:bg-gray-900/50 transition-all group"
              >
                <div className="font-medium text-white group-hover:text-amber-300 transition-colors">
                  {download.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div className="text-sm text-gray-400 mt-1 group-hover:text-amber-200/70 transition-colors">
                  View related download
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Share Section */}
      <div className="mt-12 pt-8 border-t border-gray-800">
        <h3 className="text-2xl font-bold mb-4 text-white">Share this download</h3>
        <div className="flex flex-wrap gap-3">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    frontmatter?.title || 'Check out this download'
                  )}&url=${encodeURIComponent(window.location.href)}`,
                  '_blank'
                )
              }
            }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Twitter
          </button>
          <button 
            className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.open(
                  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
                  '_blank'
                )
              }
            }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn
          </button>
          <button 
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
            onClick={() => {
              if (typeof window !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href)
                // You could add a toast notification here
                alert('Link copied to clipboard!')
              }
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Link
          </button>
        </div>
      </div>
      
      {/* Author/Credits Section (Optional) */}
      {frontmatter?.author && (
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-white mb-2">About the Author</h4>
              <p className="text-gray-400">
                {frontmatter.author}
                {frontmatter?.authorBio && ` - ${frontmatter.authorBio}`}
              </p>
              {(frontmatter?.authorWebsite || frontmatter?.authorTwitter) && (
                <div className="flex gap-3 mt-3">
                  {frontmatter.authorWebsite && (
                    <a 
                      href={frontmatter.authorWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-500 hover:text-amber-400 text-sm"
                    >
                      Website
                    </a>
                  )}
                  {frontmatter.authorTwitter && (
                    <a 
                      href={`https://twitter.com/${frontmatter.authorTwitter.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-500 hover:text-amber-400 text-sm"
                    >
                      Twitter
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Copyright Notice */}
      <div className="mt-8 pt-6 border-t border-gray-800 text-center">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} Abraham of London. All rights reserved.
          {frontmatter?.license && ` Licensed under ${frontmatter.license}.`}
        </p>
        <p className="text-xs text-gray-600 mt-2">
          This resource is provided for personal, non-commercial use.
        </p>
      </div>
    </div>
  )
}

// Add prop types for better TypeScript support
DownloadContent.defaultProps = {
  frontmatter: {},
}

export default DownloadContent
