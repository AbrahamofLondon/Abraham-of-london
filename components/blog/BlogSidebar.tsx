import React from 'react';

interface BlogSidebarProps {
  author: string | null;
  publishedDate: string;
  tags: string[];
}

const BlogSidebar: React.FC<BlogSidebarProps> = ({
  author,
  publishedDate,
  tags,
}) => {
  return (
    <div className="space-y-8">
      {/* Author Card */}
      {author && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-gray-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{author}</h3>
              <p className="text-sm text-gray-600">Content Creator</p>
            </div>
          </div>
          <p className="text-gray-700 mb-4">
            Insights and perspectives from {author}. Follow for more content on business, technology, and innovation.
          </p>
          <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors">
            Follow Author
          </button>
        </div>
      )}

      {/* Table of Contents */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold text-gray-900 mb-4">Table of Contents</h3>
        <nav className="space-y-2">
          {['Introduction', 'Key Insights', 'Practical Applications', 'Conclusion'].map((item, index) => (
            <a
              key={index}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="block text-gray-600 hover:text-blue-600 transition-colors py-1"
            >
              {index + 1}. {item}
            </a>
          ))}
        </nav>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-bold text-gray-900 mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter Signup */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="font-bold text-gray-900 mb-2">Stay Updated</h3>
        <p className="text-gray-700 text-sm mb-4">
          Get the latest articles and insights delivered to your inbox.
        </p>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Your email address"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
};

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default BlogSidebar;