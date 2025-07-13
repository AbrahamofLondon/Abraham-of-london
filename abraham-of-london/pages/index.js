// C:\Users\User\OneDrive\Desktop\Codex-setup\abraham-of-london\pages\index.js
import blogPosts from '../data/blogPosts'; // <--- CORRECTED PATH (only ONE '../')
import BlogCard from '../components/BlogCard'; // <--- CORRECTED PATH (only ONE '../')

export default function BlogIndex() {
  return (
    <section className="bg-soft-white py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Fathering Without Fear</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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