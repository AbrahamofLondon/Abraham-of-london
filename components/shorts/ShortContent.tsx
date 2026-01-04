import React from 'react';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { MDXRemote } from 'next-mdx-remote';

interface ShortContentProps {
  content: MDXRemoteSerializeResult;
  transcript?: string;
  components?: Record<string, React.ComponentType>;
}

const ShortContent: React.FC<ShortContentProps> = ({ 
  content, 
  transcript, 
  components = {} 
}) => {
  const defaultComponents = {
    // You can add custom components here
    ...components,
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <article className="prose prose-lg max-w-none">
          <MDXRemote {...content} components={defaultComponents} />
        </article>
      </div>

      {transcript && (
        <div className="bg-gray-50 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Video Transcript</h3>
            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
              Copy Transcript
            </button>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="prose prose-sm max-w-none text-gray-700">
              {transcript.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
          
          <div className="mt-6 flex items-center text-sm text-gray-500">
            <InfoIcon className="w-4 h-4 mr-2" />
            <span>This transcript was automatically generated and may contain errors.</span>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default ShortContent;