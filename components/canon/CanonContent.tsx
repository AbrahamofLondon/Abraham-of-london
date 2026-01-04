import React from 'react';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { MDXRemote } from 'next-mdx-remote';

interface CanonContentProps {
  content: MDXRemoteSerializeResult;
  components?: Record<string, React.ComponentType>;
}

const CanonContent: React.FC<CanonContentProps> = ({ content, components = {} }) => {
  const defaultComponents = {
    // Custom components for canon content
    ...components,
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <article className="prose prose-lg prose-purple max-w-none">
        <div className="mb-8 p-6 bg-purple-50 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">Learning Objectives</h3>
          <ul className="list-disc list-inside text-purple-800 space-y-1">
            <li>Understand core concepts and principles</li>
            <li>Apply knowledge to real-world scenarios</li>
            <li>Develop practical skills through exercises</li>
            <li>Assess your understanding with quizzes</li>
          </ul>
        </div>
        
        <MDXRemote {...content} components={defaultComponents} />
        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ready to continue?</h3>
              <p className="text-gray-600">Move to the next lesson or review materials</p>
            </div>
            <div className="flex space-x-4">
              <button className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors">
                Download Materials
              </button>
              <button className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                Next Lesson
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default CanonContent;