// pages/blog.tsx
import { getAllContent } from '../utils/getAllContent';
import { BlogCard } from '../components/BlogCard';

export async function getStaticProps() {
  const posts = getAllContent('blog');
  return {
    props: {
      posts,
    },
  };
}

export default function BlogPage({ posts }) {
  return (
    <div className="max-w-6xl mx-auto py-10">
      <h1 className="text-4xl font-bold mb-6">Latest Blog Posts</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogCard
            key={post.slug}
            slug={post.slug}
            title={post.frontmatter.title}
            date={post.frontmatter.date}
            excerpt={post.frontmatter.excerpt}
            coverImage={post.frontmatter.coverImage}
            category={post.frontmatter.category}
            author={post.frontmatter.author}
            readTime={post.frontmatter.readTime}
          />
        ))}
      </div>
    </div>
  );
}