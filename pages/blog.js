import BlogCard from '../components/BlogCard';
import path from 'path';
import fs from 'fs';
import matter from 'gray-matter';

export async function getStaticProps() {
  const postsDirectory = path.join(process.cwd(), 'content', 'blog');
  const filenames = fs.readdirSync(postsDirectory);

  const blogPosts = filenames.map(filename => {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter } = matter(fileContents);

    // Assuming your filename is like 'post-slug.mdx'
    const slug = filename.replace(/\.mdx$/, '');

    return {
      id: slug, // Use slug as ID
      slug,
      title: frontmatter.title,
      date: frontmatter.date,
      image: frontmatter.image || '/images/blog/default.webp', // Default image if not specified
      // Add other frontmatter fields you might need for BlogCard
    };
  });

  // Sort posts by date (newest first)
  blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Log for debugging during build (this will appear in Netlify build logs)
  console.log('--- Debugging getStaticProps in pages/blog.js ---');
  console.log('Number of blog posts fetched:', blogPosts.length);
  console.log('First blog post title:', blogPosts.length > 0 ? blogPosts[0].title : 'None');
  console.log('--- End Debugging getStaticProps ---');


  return {
    props: {
      blogPosts,
    },
    // Optional: Revalidate the page every X seconds (ISR)
    // revalidate: 60, // In seconds
  };
}

export default function BlogPage({ blogPosts }) {
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