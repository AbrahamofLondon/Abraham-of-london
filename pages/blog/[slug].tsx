// pages/blog/[slug].tsx
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Layout from '../../components/Layout';
import { getAllPosts, getPostBySlug, PostMeta } from '../../lib/posts';

interface PostPageProps {
  post: PostMeta;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPosts(['slug']);
  const paths = posts.map((p) => ({ params: { slug: p.slug } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<PostPageProps> = async ({ params }) => {
  const slug = String(params?.slug || '');
  const post = getPostBySlug(slug, [
    'slug',
    'title',
    'date',
    'publishedAt',
    'coverImage',
    'excerpt',
    'author',
    'readTime',
    'category',
    'tags',
    'content',
    'seo',
  ]);

  return {
    props: { post },
    revalidate: 60,
  };
};

export default function PostPage({ post }: PostPageProps) {
  const title = post.seo?.title || post.title || 'Post';
  const description = post.seo?.description || post.excerpt || '';
  const ogImage = post.coverImage || '/assets/images/default-blog-cover.jpg';

  return (
    <Layout>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${title} | Abraham of London`} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <article className="max-w-3xl mx-auto px-4 py-12">
        <header className="mb-8">
          <h1 className="text-4xl font-serif tracking-[0.05em] text-[#1B4332] mb-3">{post.title}</h1>
          <p className="text-sm text-gray-600">
            {post.publishedAt || post.date} · {post.author || 'Abraham of London'}
            {post.readTime ? ` · ${post.readTime}` : null}
          </p>
          {post.coverImage ? (
            <div className="relative w-full h-64 sm:h-96 mt-6">
              <Image
                src={post.coverImage}
                alt={post.title || 'Cover'}
                fill
                className="object-cover rounded"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </div>
          ) : null}
        </header>

        {/* Render raw content safely; will show markdown as formatted text (no MDX execution) */}
        <div className="prose prose-lg max-w-none">
          <div style={{ whiteSpace: 'pre-wrap' }}>{post.content || post.excerpt}</div>
        </div>

        {post.tags && post.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-2 mt-8">
            {post.tags.map((t) => (
              <li key={t} className="text-xs uppercase tracking-wide text-[#1B4332] border border-[#DDD6C7] px-3 py-1">
                {t}
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    </Layout>
  );
}
