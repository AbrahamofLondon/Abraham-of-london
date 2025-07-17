// pages/index.js

import blogPosts from '../data/blogPosts'; // Correct path to your data
import BlogCard from '../components/BlogCard';

// --- ADD THESE CONSOLE.LOGS ---
console.log('--- Debugging pages/index.js ---');
console.log('Type of blogPosts in index.js:', typeof blogPosts);
console.log('Is blogPosts an array in index.js?', Array.isArray(blogPosts));
console.log('blogPosts content (first item) in index.js:', blogPosts && blogPosts.length > 0 ? blogPosts[0].title : 'No posts or malformed');
console.log('--- End Debugging pages/index.js ---');


export default function BlogIndex() {
  return (
    <section className="bg-soft-white py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Fathering Without Fear</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Ensure this loop is UNCOMMENTED here if you want posts on the homepage */}
          {blogPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
        <div className="text-center mt-10">
          <a href="/blog" className="bg-black text-white px-6 py-3 rounded-full">View All Articles</a>
        </div>
      </div>
    </section>
  );
}