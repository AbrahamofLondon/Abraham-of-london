// pages/blog/[slug].tsx
import type { GetStaticProps, GetStaticPaths } from 'next';
import { serialize } from 'next-mdx-remote/serialize';
import Layout from '../../components/Layout';
import BlogPostCard from '../../components/BlogPostCard'; // <--- CHANGE from BlogCard to BlogPostCard
import { getPostBySlug, getPostSlugs, PostMeta } from '../../lib/posts';
import Head from 'next/head'; // This was added in a previous step

interface PostPageProps {
  post: PostMeta & { content: any }; // Requires all PostMeta fields to be present
}

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getPostSlugs();
  const paths = slugs.map((slug) => ({ params: { slug } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<PostPageProps> = async ({ params }) => {
  const slug = params?.slug as string;
  // Get partial post data
  const partialPost = getPostBySlug(slug, [
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

  // Ensure all required fields are present with defaults
  const post: PostMeta = {
    slug: partialPost.slug || '',
    title: partialPost.title || '',
    date: partialPost.date || '',
    coverImage: partialPost.coverImage || '',
    excerpt: partialPost.excerpt || '',
    author: partialPost.author || '',
    readTime: partialPost.readTime || '',
    category: partialPost.category || '',
    tags: partialPost.tags || [],
  };

  // Assuming you want to serialize the post content (not just excerpt)
  // If `getPostBySlug` returns the full markdown content, serialize that.
  // Otherwise, ensure the correct field is being used for serialization.
  const content = await serialize(post.excerpt || ''); // Or `post.content` if available

  return {
    props: {
      post: { ...post, content },
    },
    revalidate: 1,
  };
};

const PostPage: React.FC<PostPageProps> = ({ post }) => {
  return (
    <Layout>
      <Head>
        <title>{post.title} - Abraham of London Blog</title> {/* Good practice to have a unique title */}
        <meta name="description" content={post.excerpt} />
      </Head>
      <article className="container mx-auto px-4 py-8 max-w-3xl">
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
        <div className="prose lg:prose-lg mt-8" dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
    </Layout>
  );
};

export default PostPage;