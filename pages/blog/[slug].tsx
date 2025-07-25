// pages/blog/[slug].tsx
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Layout from '../../components/Layout';
import { getPostBySlug, getPostSlugs, PostMeta } from '../../lib/posts'; // Ensure correct import for functions

interface PostPageProps {
  post: PostMeta & { content: any }; // Include content in the type
}

// MDX components if you have any custom ones (e.g., custom images, code blocks)
const components = {
  // You can add custom components here like:
  // img: (props: any) => <Image {...props} />,
  // a: (props: any) => <Link href={props.href}>{props.children}</Link>,
};

const PostPage: React.FC<PostPageProps> = ({ post }) => {
  if (!post) {
    return <Layout><div>Post not found.</div></Layout>;
  }

  const { title, date, coverImage, author, readTime, category, tags, content } = post;

  return (
    <Layout>
      <Head>
        <title>{title} - Abraham of London Blog</title>
        <meta name="description" content={post.excerpt} />
        {/* Open Graph / Twitter meta tags for sharing */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={post.excerpt} />
        {coverImage && <meta property="og:image" content={coverImage} />}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`/blog/${post.slug}`} />
        <meta name="twitter:card" content="summary_large_image" />
        {coverImage && <meta name="twitter:image" content={coverImage} />}
      </Head>

      <article className="container mx-auto px-4 py-8">
        {coverImage && (
          <div className="relative w-full h-80 md:h-96 lg:h-[500px] mb-8 overflow-hidden rounded-lg shadow-lg">
            <Image
              src={coverImage}
              alt={title}
              fill
              style={{ objectFit: 'cover' }}
              priority // Prioritize loading for LCP
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            />
          </div>
        )}

        <header className="mb-8 text-center">
          {category && (
            <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full mb-2">
              {category}
            </span>
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            {title}
          </h1>
          <div className="text-gray-600 text-sm flex justify-center items-center flex-wrap">
            <span>By {author}</span>
            <span className="mx-2">•</span>
            <span>{new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            {readTime && (
              <>
                <span className="mx-2">•</span>
                <span>{readTime}</span>
              </>
            )}
          </div>
          {tags && tags.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-block bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <section className="prose prose-lg mx-auto text-gray-800 leading-relaxed max-w-3xl">
          <MDXRemote {...content} components={components} />
        </section>
      </article>
    </Layout>
  );
};

// Generates paths for all blog posts based on their slugs
export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getPostSlugs(); // This function should now use the correct 'posts' directory
  const paths = slugs.map((slug) => ({
    params: { slug },
  }));

  return {
    paths,
    fallback: false, // Set to 'blocking' or true if you want to use fallback pages
  };
};

// Fetches data for a specific blog post based on its slug
export const getStaticProps: GetStaticProps<PostPageProps> = async ({ params }) => {
  const slug = params?.slug as string;
  const post = getPostBySlug(slug, ['title', 'date', 'coverImage', 'excerpt', 'author', 'readTime', 'category', 'tags', 'content']);

  // Serialize MDX content
  const mdxSource = await serialize(post.content);

  return {
    props: {
      post: {
        ...post,
        content: mdxSource,
      },
    },
    revalidate: 1, // Re-generate the page at most once every 1 second
  };
};

export default PostPage;