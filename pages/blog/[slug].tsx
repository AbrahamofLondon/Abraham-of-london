import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import type { GetStaticProps, GetStaticPaths } from 'next';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote } from 'next-mdx-remote';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { getPostBySlug, getAllPosts, PostMeta } from '../../lib/posts';
import DateFormatter from '../../components/DateFormatter';
import { MDXComponents } from '../../components/MDXComponents';
interface PostProps {
  post: {
    meta: PostMeta;
    content: MDXRemoteSerializeResult;
  };
}

export default function Post({ post }: PostProps) {
  const pageTitle = `${post.meta.title} | Abraham of London Blog`;
  const siteUrl = 'https://abrahamoflondon.org';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={post.meta.description || post.meta.excerpt || ''} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={post.meta.description || post.meta.excerpt || ''} />
        <meta property="og:image" content={`${siteUrl}${post.meta.coverImage || ''}`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${siteUrl}/blog/${post.meta.slug}`} />
        <meta property="article:published_time" content={new Date(post.meta.date).toISOString()} />
        <meta property="article:author" content={post.meta.author || ''} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={post.meta.description || post.meta.excerpt || ''} />
        <meta name="twitter:image" content={`${siteUrl}${post.meta.coverImage || ''}`} />
        <link rel="canonical" href={`${siteUrl}/blog/${post.meta.slug}`} />
      </Head>

      <div className="blog-post-content">
        <article className="max-w-3xl mx-auto px-4 py-8 md:py-16">
          {post.meta.coverImage && (
            <div className="mb-8 md:mb-16 relative w-full h-80 rounded-lg overflow-hidden shadow-lg">
              <Image
                src={post.meta.coverImage}
                alt={`Cover Image for ${post.meta.title}`}
                fill // Replaced layout="fill" with modern prop
                style={{ objectFit: 'cover' }} // Moved objectFit to style
                priority
              />
            </div>
          )}

          <header className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-gray-900 mb-4">
              {post.meta.title}
            </h1>
            <div className="text-lg text-gray-600 mb-4">
              By <span className="font-semibold">{post.meta.author}</span> on{' '}
              <DateFormatter dateString={post.meta.date} /> | {post.meta.readTime} read
            </div>
            {post.meta.category && (
              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mr-2">
                {post.meta.category}
              </span>
            )}
            {post.meta.tags &&
              post.meta.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block bg-gray-200 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mr-2"
                >
                  #{tag}
                </span>
              ))}
          </header>

          <div className="prose prose-lg mx-auto mb-16">
            <MDXRemote {...post.content} components={MDXComponents} />
          </div>

          <div className="text-center">
            <Link href="/blog" className="text-blue-600 hover:underline text-xl font-medium">
              &larr; Back to Blog
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps<PostProps> = async ({ params }) => {
  const { slug } = params as { slug: string };
  const postData = getPostBySlug(slug, [
    'title',
    'date',
    'slug',
    'author',
    'content',
    'coverImage',
    'excerpt',
    'readTime',
    'category',
    'tags',
    'description',
  ]) as { content: string } & PostMeta; // Typed postData explicitly

  const { content, ...meta } = postData;
  const mdxSource = await serialize(content || '', {
    parseFrontmatter: true,
    scope: meta,
  });

  return {
    props: {
      post: {
        meta: meta as PostMeta,
        content: mdxSource,
      },
    },
    revalidate: 10,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPosts(['slug']);

  return {
    paths: posts.map((post) => ({
      params: {
        slug: post.slug,
      },
    })),
    fallback: 'blocking',
  };
};