// components/resources/ResourceContent.tsx - FINAL PRODUCTION FIX
import React from 'react';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';

interface ResourceContentProps {
  content: any; // Accept any to handle different serialization formats
  components?: Record<string, React.ComponentType<any>>;
}

const ResourceContent: React.FC<ResourceContentProps> = ({ 
  content, 
  components = {} 
}) => {
  // Type guard to check if content is serialized MDX
  const isMDXSerialized = (obj: any): boolean => {
    return obj && 
           typeof obj === 'object' && 
           ('compiledSource' in obj || 'source' in obj);
  };

  // Transform compiledSource to source if needed for compatibility
  const normalizeContent = (content: any): any => {
    if ('compiledSource' in content && !('source' in content)) {
      // Map compiledSource to source for compatibility
      return {
        ...content,
        source: content.compiledSource,
      } as MDXRemoteSerializeResult;
    }
    return content as MDXRemoteSerializeResult;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <article className="prose prose-lg prose-blue max-w-none">
        {isMDXSerialized(content) ? (
          <MDXRemote {...(normalizeContent(content) as any)} components={components} />
        ) : (
          // Fallback for non-serialized content
          <div dangerouslySetInnerHTML={{ 
            __html: typeof content === 'string' ? content : JSON.stringify(content) 
          }} />
        )}
        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Found this resource helpful?</h3>
              <p className="text-gray-600">Share it with your network</p>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={() => {
                  const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Share on Twitter
              </button>
              <button 
                onClick={() => {
                  console.log('Download PDF functionality to be implemented');
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
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