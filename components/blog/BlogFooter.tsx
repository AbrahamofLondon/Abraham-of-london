import React from 'react';
import Link from 'next/link';

interface BlogFooterProps {
  author?: string;
  authorBio?: string;
  authorWebsite?: string;
}

const BlogFooter: React.FC<BlogFooterProps> = ({
  author = 'Abraham of London',
  authorBio = 'Thought leader and content creator sharing insights on business, technology, and innovation.',
  authorWebsite = 'https://www.abrahamoflondon.org',
}) => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* About Author */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Author</h3>
            <p className="text-gray-700 mb-4">
              {authorBio}
            </p>
            <Link
              href={authorWebsite}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Visit author website →
            </Link>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Explore More</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/blog" className="text-gray-600 hover:text-gray-900 transition-colors">
                  All Articles
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Free Resources
                </Link>
              </li>
              <li>
                <Link href="/books" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Books
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Courses
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Never Miss an Update</h3>
            <p className="text-gray-700 mb-4">
              Subscribe to get the latest posts and resources directly in your inbox.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg font-medium">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-300 text-center text-gray-600">
          <p>© {new Date().getFullYear()} Abraham of London. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default BlogFooter;
