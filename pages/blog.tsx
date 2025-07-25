// pages/blog.tsx
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Layout from '../components/Layout';
import BlogCard from '../components/BlogCard';
import { getAllPosts, PostMeta } from '../lib/posts';

interface BlogPageProps {
  posts: PostMeta[];
}

const BlogPage: React.FC<BlogPageProps> = ({ posts }) => {
  // This console.log will now appear in your browser's developer console
  console.log('Posts prop received by BlogPage component (client-side):', posts.map(p => p.slug));

  return ( // This is the ONE and ONLY return for the component's JSX
    <Layout>
      <Head>
        <title>Blog - Abraham of London</title>
        <meta name="description" content="Read the latest insights and articles from Abraham of London on fatherhood, faith, legacy, and more." />
      </Head>

      <section className="container mx-auto px-4 py-12">
        <h1 className="text-5xl font-extrabold text-center text-gray-900 mb-12">Latest Insights</h1>

        {posts.length === 0 ? (
          <p className="text-center text-gray-600 text-xl">No blog posts available yet. Check back soon!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <BlogCard
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
        )}
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
    'tags'
  ]);

  // This console.log will appear in your terminal during build/dev server startup
  console.log('Posts fetched by getStaticProps (server-side):', posts.map(p => p.slug));

  return {
    props: {
      posts,
    },
    revalidate: 1, // Optional: Re-generate the page at most once every 1 second
  };
};

export default BlogPage;