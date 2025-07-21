import React from 'react';
import { getAllContent } from '../../utils/getAllContent';
import BlogCard from '../../components/BlogCard'; // Adjust path if needed
import Layout from '../../components/Layout'; // Assuming you have a Layout component

interface PostFrontmatter {
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  category: string;
  author: string;
  readTime: string;
}

interface Post {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
}

interface BlogProps {
  posts: Post[];
}

export const getStaticProps = async () => {
  const posts = getAllContent('blog');

  // Sort posts by date in descending order (most recent first)
  posts.sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());

  return {
    props: {
      posts: posts.map(({ slug, frontmatter }) => ({
        slug,
        frontmatter,
      })),
    },
  };
};

const Blog: React.FC<BlogProps> = ({ posts }) => {
  return (
    <Layout> {/* Assuming your Layout component exists */}
      <section className="container mx-auto py-12 px-4">
        <h1 className="text-4xl font-display font-bold text-center mb-8">All Blog Posts</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <BlogCard
              key={post.slug}
              title={post.frontmatter.title}
              date={post.frontmatter.date}
              excerpt={post.frontmatter.excerpt}
              coverImage={post.frontmatter.coverImage}
              category={post.frontmatter.category}
              author={post.frontmatter.author}
              readTime={post.frontmatter.readTime}
              slug={post.slug}
            />
          ))}
        </div>
      </section>
    </Layout>
  );
  };

export default Blog;