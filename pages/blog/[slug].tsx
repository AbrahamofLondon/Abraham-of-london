// pages/blog/[slug].tsx
import Head from 'next/head';
import Image from 'next/image';
import type { GetStaticProps, GetStaticPaths } from 'next';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import Layout from '../../components/Layout';
import MDXProviderWrapper from '../../components/MDXProviderWrapper';
import { MDXComponents } from '../../components/MDXComponents';
import { getAllPosts, getPostBySlug, PostMeta } from '../../lib/posts';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkHtml from 'remark-html';
import rehypeStringify from 'rehype-stringify';

type PageMeta = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  author: string;
  readTime: string;
  category: string;
};

type Props = {
  post: {
    meta: PageMeta;
    content: MDXRemoteSerializeResult;
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || '');
  const raw = getPostBySlug(slug, [
    'slug',
    'title',
    'date',
    'publishedAt',
    'excerpt',
    'coverImage',
    'author',
    'readTime',
    'category',
    'content',
  ]) as Partial<PostMeta> & { content?: string };

  if (!raw.slug || raw.title === 'Post Not Found') return { notFound: true };

  const meta: PageMeta = {
    slug: raw.slug,
    title: raw.title || 'Untitled',
    date: (raw.date || raw.publishedAt || '') as string,
    excerpt: raw.excerpt || '',
    coverImage:
      typeof raw.coverImage === 'string' && raw.coverImage.trim()
        ? raw.coverImage
        : '/assets/images/blog/default-blog-cover.jpg',
    author: raw.author || 'Abraham of London',
    readTime: raw.readTime || '5 min read',
    category: raw.category || 'General',
  };

  const mdx = await serialize(raw.content ?? '', {
    parseFrontmatter: false,
    scope: meta,
    mdxOptions: {
      remarkPlugins: [
        remarkGfm,
        remarkParse,
        remarkRehype,
        remarkHtml,
      ],
      rehypePlugins: [rehypeStringify],
    },
  });

  return { props: { post: { meta, content: mdx } }, revalidate: 60 };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPosts(['slug']);
  return {
    paths: posts.map((p) => ({ params: { slug: String(p.slug) } })),
    fallback: 'blocking',
  };
};

export default function BlogPost({ post }: Props) {
  const siteUrl = 'https://abrahamoflondon.org';
  return (
    <Layout>
      <MDXProviderWrapper>
        <Head>
          <title>{post.meta.title} | Abraham of London</title>
          <meta name="description" content={post.meta.excerpt || 'Article by Abraham of London'} />
          <meta property="og:image" content={`${siteUrl}${post.meta.coverImage}`} />
        </Head>

        <article className="max-w-3xl mx-auto px-4 py-8 md:py-16">
          {post.meta.coverImage && (
            <div className="mb-8 md:mb-16 relative w-full h-80 rounded-lg overflow-hidden shadow-lg">
              <Image
                src={post.meta.coverImage}
                alt={post.meta.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <h1 className="font-serif text-5xl md:text-6xl tracking-brand text-forest mb-6">{post.meta.title}</h1>

          <div className="text-sm text-deepCharcoal/70 mb-4">
            <span>{post.meta.author}</span> · <span>{post.meta.date}</span>
            {post.meta.readTime && <span> · {post.meta.readTime}</span>}
            {post.meta.category && (
              <span className="ml-2 inline-block text-xs rounded bg-warmWhite border border-lightGrey px-2 py-1">
                {post.meta.category}
              </span>
            )}
          </div>

          <div className="prose prose-lg max-w-none text-deepCharcoal">
            <MDXRemote {...post.content} components={MDXComponents} />
          </div>
        </article>
      </MDXProviderWrapper>
    </Layout>
  );
}