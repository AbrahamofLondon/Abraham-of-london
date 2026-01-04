import React from 'react'
import { MDXRemote } from 'next-mdx-remote'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamically import heavy components
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

const DownloadCTA = dynamic(
  () => import('@/components/content/DownloadCTA'),
  { ssr: false }
)

interface DownloadContentProps {
  content: any // MDX content
  frontmatter?: any
}

const components = {
  LegacyCanvasInteractive,
  ProTip,
  FeatureGrid,
  DownloadCTA,
  a: (props: any) => <Link {...props} />,
  h2: (props: any) => <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900" {...props} />,
  h3: (props: any) => <h3 className="text-xl font-bold mt-6 mb-3 text-slate-900" {...props} />,
  p: (props: any) => <p className="text-slate-700 mb-4 leading-relaxed" {...props} />,
  ul: (props: any) => <ul className="list-disc pl-5 mb-4 text-slate-700 space-y-2" {...props} />,
  ol: (props: any) => <ol className="list-decimal pl-5 mb-4 text-slate-700 space-y-2" {...props} />,
  li: (props: any) => <li className="mb-1" {...props} />,
  strong: (props: any) => <strong className="font-semibold" {...props} />,
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-slate-300 pl-4 italic my-6 text-slate-600" {...props} />
  ),
}

const DownloadContent: React.FC<DownloadContentProps> = ({ content, frontmatter }) => {
  if (!content) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Content Loading</h3>
          <p className="text-yellow-700">The download content is being loaded...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="prose prose-lg max-w-none">
        <MDXRemote {...content} components={components} />
      </div>
      
      {/* Related Downloads */}
      {frontmatter?.relatedDownloads && frontmatter.relatedDownloads.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-bold mb-6 text-slate-900">Related Downloads</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {frontmatter.relatedDownloads.map((download: string, index: number) => (
              <Link
                key={index}
                href={`/downloads/${download}`}
                className="block p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <div className="font-medium text-slate-900">{download}</div>
                <div className="text-sm text-slate-600 mt-1">View related download</div>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Share Section */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <h3 className="text-2xl font-bold mb-4 text-slate-900">Share this download</h3>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
            Twitter
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            LinkedIn
          </button>
          <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
            Copy Link
          </button>
        </div>
      </div>
    </div>
  )
}

export default DownloadContent