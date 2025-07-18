import React from 'react';
import Link from 'next/link'; // Import Link for navigation

function BlogCard({ post }) {
  // --- Debugging in BlogCard component ---
  // This log will appear in your browser's console (F12 -> Console)
  // It helps check if individual 'post' objects are being passed correctly
  console.log('BlogCard received post:', post);

  // Ensure post object and its essential properties exist before accessing them
  if (!post || !post.slug || !post.title) {
    console.warn("BlogCard received malformed or missing post data:", post);
    return null; // Don't render anything if essential data is missing
  }

  // Construct the correct path to the individual blog post
  const postPath = `/blog/${post.slug}`;

  return (
    <Link href={postPath} passHref> {/* Add passHref for proper <a> tag rendering with Next/Link */}
      {/* Use an <a> tag inside Link, give it appropriate styling */}
      {/* Add 'group' for hover effects, 'block' to make it clickable area */}
      <a className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
        {/* Ensure image path is correct, assuming /public/images/blog */}
        {post.image && (
          <div className="w-full h-48 overflow-hidden">
            {/* Using next/image for optimized images is recommended for production */}
            {/* import Image from 'next/image'; */}
            {/* <Image
              src={post.image}
              alt={post.title}
              width={500} // Set appropriate width and height based on your design
              height={300}
              layout="responsive" // Or "fill", "fixed" based on your needs
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            /> */}
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        <div className="p-6 flex-grow flex flex-col">
          {/* Blog Post Title */}
          <h3 className="text-xl font-semibold mb-2 text-gray-800 group-hover:text-primary-600 line-clamp-2">
            {post.title}
          </h3>

          {/* Date and Author (optional, but good for context) */}
          {post.date && (
            <p className="text-sm text-gray-500 mb-2">
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {post.author && ` by ${post.author}`}
            </p>
          )}

          {/* Blog Post Excerpt */}
          {/* Ensure 'excerpt' is returned from getStaticProps for this to display */}
          {post.excerpt && (
            <p className="text-gray-600 text-base mb-4 flex-grow line-clamp-3">
              {post.excerpt}
            </p>
          )}

          {/* Tags (optional) */}
          {/* Ensure 'tags' is returned from getStaticProps for this to display */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-auto pt-2">
              {post.tags.map(tag => (
                <span key={tag} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </a>
    </Link>
  );
}

export default BlogCard;