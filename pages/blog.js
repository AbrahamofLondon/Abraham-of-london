import { blogPosts } from '../data/blogPosts';
import BlogCard from '../components/BlogCard';

console.log('--- Debugging pages/blog.js ---');
console.log('Type of blogPosts in blog.js:', typeof blogPosts);
console.log('Is blogPosts an array in blog.js?', Array.isArray(blogPosts));
console.log('blogPosts content (first item) in blog.js:', blogPosts && blogPosts.length > 0 ? blogPosts[0].title : 'No posts or malformed');
console.log('--- End Debugging pages/blog.js ---');

export default function BlogPage() {
  return (
    <section className="bg-soft-white py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">All Articles</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
