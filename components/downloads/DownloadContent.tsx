// components/downloads/DownloadContent.tsx
import React from 'react'
import { MDXRemote } from 'next-mdx-remote'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamically import heavy components with ssr: false
const LegacyCanvasInteractive = dynamic(
  () => import('@/components/downloads/LegacyCanvasInteractive'),
  { ssr: false }
)

const ProTip = dynamic(
  () => import('@/components/content/ProTip'),
  { ssr: false }
)

const FeatureGrid = dynamic(
  () => import('@/components/content/FeatureGrid'),
  { ssr: false }
)

// CRITICAL: DownloadCTA MUST be client-only with ssr: false
const DownloadCTA = dynamic(
  () => import('@/components/content/DownloadCTA'),
  { 
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    )
  }
)

interface DownloadContentProps {
  content: any // MDX content
  frontmatter?: any
}

// Basic components that don't need SCSS/CSS
const components = {
  LegacyCanvasInteractive,
  ProTip,
  FeatureGrid,
  DownloadCTA,
  a: (props: any) => <Link {...props} />,
  h2: (props: any) => <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-100" {...props} />,
  h3: (props: any) => <h3 className="text-xl font-bold mt-6 mb-3 text-slate-900 dark:text-slate-100" {...props} />,
  p: (props: any) => <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed" {...props} />,
  ul: (props: any) => <ul className="list-disc pl-5 mb-4 text-slate-700 dark:text-slate-300 space-y-2" {...props} />,
  ol: (props: any) => <ol className="list-decimal pl-5 mb-4 text-slate-700 dark:text-slate-300 space-y-2" {...props} />,
  li: (props: any) => <li className="mb-1" {...props} />,
  strong: (props: any) => <strong className="font-semibold" {...props} />,
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 italic my-6 text-slate-600 dark:text-slate-400" {...props} />
  ),
  // Add more components as needed
}

const DownloadContent: React.FC<DownloadContentProps> = ({ content, frontmatter }) => {
  if (!content) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Content Loading</h3>
          <p className="text-yellow-700 dark:text-yellow-300">The download content is being loaded...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Main content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <MDXRemote {...content} components={components} />
      </div>
      
      {/* Related Downloads */}
      {frontmatter?.relatedDownloads && frontmatter.relatedDownloads.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">Related Downloads</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {frontmatter.relatedDownloads.map((download: string, index: number) => (
              <Link
                key={index}
                href={`/downloads/${download}`}
                className="block p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="font-medium text-slate-900 dark:text-slate-100">{download}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">View related download</div>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Share Section */}
      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Share this download</h3>
        <div className="flex flex-wrap gap-3">
          <button 
            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(document.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
          >
            Twitter
          </button>
          <button 
            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
          >
            LinkedIn
          </button>
          <button 
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              // You could add a toast notification here
            }}
          >
            Copy Link
          </button>
        </div>
      </div>
    </div>
  )
}

export default DownloadContent