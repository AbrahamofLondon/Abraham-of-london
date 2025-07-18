import BlogCard from '../components/BlogCard';
import path from 'path';
import fs from 'fs';
import matter from 'gray-matter';

// Assuming you have a Layout component for consistent page structure
// import Layout from '../components/Layout'; // Uncomment if you use a Layout component

export async function getStaticProps() {
  const postsDirectory = path.join(process.cwd(), 'content', 'blog');
  let filenames = [];
  let blogPosts = [];

  try {
    filenames = fs.readdirSync(postsDirectory);
  } catch (error) {
    console.error(`Error reading posts directory: ${postsDirectory}`, error);
    // Return empty array if directory not found or cannot be read
    return {
      props: {
        blogPosts: [],
      },
    };
  }

  blogPosts = filenames.map(filename => {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter } = matter(fileContents);

    // Assuming your filename is like 'post-slug.mdx'
    const slug = filename.replace(/\.mdx$/, '');

    return {
      id: slug, // Use slug as ID
      slug,
      title: frontmatter.title || 'Untitled Post', // Provide fallback for title
      date: frontmatter.date || new Date().toISOString(), // Provide fallback for date
      image: frontmatter.image || '/images/blog/default.webp', // Default image if not specified
      excerpt: frontmatter.excerpt || '', // Add excerpt for BlogCard
      tags: frontmatter.tags || [], // Add tags for BlogCard
      author: frontmatter.author || 'Abraham', // Add author if present in frontmatter
    };
  });

  // Sort posts by date (newest first)
  blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // --- Debugging getStaticProps during build time ---
  console.log('\n--- Debugging getStaticProps in pages/blog.js ---');
  console.log(`Resolved posts directory: ${postsDirectory}`);
  console.log(`Files found in directory: ${filenames.join(', ')}`);
  console.log(`Number of blog posts fetched: ${blogPosts.length}`);
  if (blogPosts.length > 0) {
    console.log(`First blog post title: "${blogPosts[0].title}"`);
    console.log(`First blog post slug: "${blogPosts[0].slug}"`);
    console.log(`First blog post image: "${blogPosts[0].image}"`);
  } else {
    console.log('No blog posts found.');
  }
  console.log('--- End Debugging getStaticProps ---\n');

  return {
    props: {
      blogPosts,
    },
    // Optional: Revalidate the page every X seconds (ISR)
    // revalidate: 60, // In seconds
  };
}

export default function BlogPage({ blogPosts }) {
  // --- Debugging in the component during client-side hydration ---
  // This log will appear in your browser's console (F12 -> Console)
  console.log('BlogPage component rendering. Posts received:', blogPosts);

  return (
    // <Layout> // Uncomment and wrap your content if you use a Layout component
      <section className="bg-soft-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-center">All Articles</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts && blogPosts.length > 0 ? (
              blogPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))
            ) : (
              <p className="text-center text-gray-600 text-lg">
                No blog posts found. Please ensure your `.mdx` files are in the `content/blog` directory.
              </p>
            )}
          </div>
        </div>
      </section>
    // </Layout> // Uncomment if you use a Layout component
  );
}