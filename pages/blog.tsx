import Head from 'next/head';
import Layout from '../components/Layout';
import BlogPostCard from '../components/BlogPostCard'; // <--- CHANGE from BlogCard to BlogPostCard
import { getAllPosts, PostMeta } from '../lib/posts';
import { GetStaticProps } from 'next'; // Add this import if missing or implicit

interface BlogPageProps {
  posts: PostMeta[];
}

const BlogPage: React.FC<BlogPageProps> = ({ posts }) => {
  return (
    <Layout>
      <Head>
        <title>Abraham of London - Blog</title>
        <meta name="description" content="Read the latest blog posts from Abraham of London on various topics." />
      </Head>

      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">All Blog Posts</h1>
          {posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <BlogPostCard // <--- CHANGE from BlogCard to BlogPostCard here as well
                  key={post.slug}
                  slug={post.slug}
                  title={post.title}
                  date={post.date}
                  coverImage={post.coverImage}
                  excerpt={post.excerpt}
                  author={post.author}
                  readTime={post.readTime}
                  category={post.category}
                  tags={post.tags}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No blog posts found yet.</p>
          )}
        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<BlogPageProps> = async () => {
  const posts = getAllPosts([
    'slug',
    'title',
    'date',
    'coverImage',
    'excerpt',
    'author',
    'readTime',
    'category',
    'tags',
  ]);

  return {
    props: {
      posts,
    },
    revalidate: 1, // Optional: Use ISR if you want to regenerate the page periodically
  };
};

export default BlogPage;