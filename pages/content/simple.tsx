// pages/content/simple.tsx (alternative)
import type { NextPage } from 'next'
import Layout from '@/components/Layout'

const SimpleContent: NextPage = () => {
  return (
    <Layout title="Content Library">
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-4xl font-bold mb-8">Content Library</h1>
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-300 mb-8">
            A comprehensive library of essays, books, tools, and resources.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Simple static content */}
            {['Essays', 'Books', 'Tools', 'Events', 'Resources'].map((cat) => (
              <div key={cat} className="bg-gray-900 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-3">{cat}</h3>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SimpleContent
