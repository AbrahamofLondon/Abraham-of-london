// pages/blog.tsx
import Head from 'next/head';
import { GetStaticProps } from 'next';
import { getAllPosts, PostMeta } from '../lib/posts'; // Adjust path if necessary
import BlogCard from '../components/BlogCard'; // Assuming BlogCard exists

interface BlogProps {
  posts: PostMeta[];
}

const Blog: React.FC<BlogProps> = ({ posts }) => {
  return (
    <>
      <Head>
        <title>Blog | Abraham of London</title>
        <meta name="description" content="Explore insightful articles and thoughts from Abraham of London." />
      </Head>
      <section className="container mx-auto py-10 px-4">
        <h1 className="text-4xl font-display font-bold text-primary mb-8 text-center">Our Blog</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <BlogCard key={post.slug} {...post} />
          ))}
        </div>
      </section>
    </>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const posts = getAllPosts().map(({ data, slug }) => ({ ...data, slug }));

  return {
    props: {
      posts,
    },
  };
};

export default Blog;