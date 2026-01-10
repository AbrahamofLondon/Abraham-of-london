import React from 'react';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { MDXRemote } from 'next-mdx-remote';

interface ResourceContentProps {
  content: MDXRemoteSerializeResult;
  components?: Record<string, React.ComponentType>;
}

const ResourceContent: React.FC<ResourceContentProps> = ({ content, components = {} }) => {
  const defaultComponents = {
    // You can add custom components here
    ...components,
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <article className="prose prose-lg prose-blue max-w-none">
        <MDXRemote {...content} components={defaultComponents} />
        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Found this resource helpful?</h3>
              <p className="text-gray-600">Share it with your network</p>
            </div>
            <div className="flex space-x-4">
              <button className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors">
                Share on Twitter
              </button>
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default ResourceContent;
