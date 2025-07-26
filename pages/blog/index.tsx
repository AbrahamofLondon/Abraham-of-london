// pages/blog/index.tsx
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import BlogPostCard from '../../components/BlogPostCard';
import { getAllPosts, PostMeta } from '../../lib/posts';

interface BlogIndexProps {
  posts: PostMeta[];
}

const BlogIndex: React.FC<BlogIndexProps> = ({ posts }) => {
  const siteUrl = 'https://abrahamoflondon.org';
  const pageTitle = 'Blog - Abraham of London';
  const pageDescription = 'Latest articles and insights on fearless fatherhood, faith, justice, and legacy.';

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    'url': `${siteUrl}/blog`,
    'name': pageTitle,
    'description': pageDescription,
    'publisher': {
      '@type': 'Organization',
      'name': 'Abraham of London',
      'url': siteUrl,
      'logo': {
        '@type': 'ImageObject',
        'url': `${siteUrl}/assets/images/abraham-logo.jpg`,
      },
    },
    'blogPost': posts.map(post => ({
      '@type': 'BlogPosting',
      'headline': post.title,
      'url': `${siteUrl}/blog/${post.slug}`,
      'datePublished': post.date,
      'author': {
        '@type': 'Person',
        'name': post.author,
      },
      'description': post.excerpt,
      'image': post.coverImage || `${siteUrl}/assets/images/default-blog.jpg`,
    })),
  };

  return (
    <Layout>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={`${siteUrl}/assets/images/og-blog.jpg`} />
        <meta property="og:type" content="blog" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={`${siteUrl}/assets/images/og-blog.jpg`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </Head>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold text-center mb-12 text-gray-800">Latest Blog Posts</h1>

          {posts.length > 0 ? (
            <div className="grid gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {posts.map(post => (
                <BlogPostCard
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
            <p className="text-center text-gray-500">No blog posts found.</p>
          )}
        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
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
    revalidate: 10,
  };
};

export default BlogIndex;
