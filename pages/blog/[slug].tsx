import { GetStaticPaths, GetStaticProps } from 'next';
import { MDXRemote } from 'next-mdx-remote';
import { getPostBySlug, getAllPosts } from '../../lib/api';
import Layout from '../../components/Layout';
import { MDXComponents } from '../../components/MDXComponents';
import Link from 'next/link';

interface PostPageProps {
  post: {
    meta: {
      title: string;
      date: string;
      slug: string;
      author: string;
      coverImage: string;
      excerpt: string;
      tags: string[];
    };
    source: any;
  };
}

export default function PostPage({ post }: PostPageProps) {
  return (
    <Layout>
      <article className="prose lg:prose-xl mx-auto px-4">
        <header>
          <h1 className="text-4xl font-bold">{post.meta.title}</h1>
          <p className="text-gray-500 text-sm">{post.meta.date}</p>
          <div className="mt-2">
            {post.meta.tags.map((tag) => (
              <span
                key={tag}
                className="inline-block bg-gray-200 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mr-2"
              >
                #{tag}
              </span>
            ))}
          </div>
        </header>

        <div className="prose prose-lg mx-auto mb-16">
          <MDXRemote {...post.source} components={MDXComponents} />
        </div>

        <div className="text-center">
          <Link href="/blog" className="text-blue-600 hover:underline text-xl font-medium">
            &larr; Back to Blog
          </Link>
        </div>
      </article>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params as { slug: string };
  const { content, data } = getPostBySlug(slug, [
    'title',
    'date',
    'slug',
    'author',
    'content',
    'coverImage',
    'excerpt',
    'tags',
  ]);

  return {
    props: {
      post: {
        meta: data,
        source: content,
      },
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPosts(['slug']);
  const paths = posts.map((post) => ({
    params: {
      slug: post.slug,
    },
  }));

  return {
    paths,
    fallback: false,
  };
};
