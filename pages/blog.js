import BlogCard from '../components/BlogCard';
import path from 'path';
import fs from 'fs';
import matter from 'gray-matter';
import Layout from '../components/Layout';

export async function getStaticProps() {
  const postsDirectory = path.join(process.cwd(), 'content', 'blog');
  let filenames = [];
  let blogPosts = [];

try {
    filenames = fs.readdirSync(postsDirectory);
} catch (error) {
    console.error('Error reading posts directory: ${postsDirectory}', error);
    return { props: { blogPosts: [] } };
}
  blogPosts = filenames.map(filename => {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter } = matter(fileContents);
    const slug = filename.replace(/\.mdx$/, '');

    return {
      id: slug,
      slug,
      title: frontmatter.title || 'Untitled Post',
      date: frontmatter.date || new Date().toISOString(),
      image: frontmatter.image || '/assets/images/default-blog.webp',
      excerpt: frontmatter.excerpt || '',
      tags: frontmatter.tags || [],
      author: frontmatter.author || 'Abraham of London',
    };
  });

  blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    props: {
      blogPosts,
    },
  };
}

export default function BlogPage({ blogPosts }) {
  return (
    <Layout>
      <section className="bg-soft-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-center">All Articles</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.length > 0 ? (
              blogPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))
            ) : (
              <p className="text-center text-gray-600 text-lg">
                No blog posts found. Please ensure your .mdx files are in the content/blog directory.
              </p>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}