// pages/blog/[slug].tsx
declare global {
  interface Window {
    DISQUS?: any;
  }
}
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Layout from '../../components/Layout';
// Import PostWithContent as well for accurate typing in getStaticProps
import { getAllPosts, getPostBySlug, PostMeta, PostWithContent } from '../../lib/posts'; 
import Link from 'next/link';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { useEffect } from 'react';

interface BlogPageProps {
  // The 'post' prop passed to the component WILL have content as MDXRemoteSerializeResult
  post: PostMeta & {
    content: MDXRemoteSerializeResult;
  };
}

const DisqusComments = ({ slug, title }: { slug: string; title: string }) => {
  useEffect(() => {
    if (window.DISQUS) {
      window.DISQUS.reset({
        reload: true,
        config: function () {
          this.page.identifier = slug;
          this.page.url = `https://abrahamoflondon.org/blog/${slug}`;
          this.page.title = title;
        },
      });
    } else {
      (window as any).disqus_config = function () {
        this.page.identifier = slug;
        this.page.url = `https://abrahamoflondon.org/blog/${slug}`;
        this.page.title = title;
      };
      const d = document,
        s = d.createElement('script');
      // IMPORTANT: Replace 'YOUR_DISQUS_SHORTNAME' with your actual Disqus shortname
      s.src = 'https://YOUR_DISQUS_SHORTNAME.disqus.com/embed.js'; 
      s.setAttribute('data-timestamp', Date.now().toString());
      (d.head || d.body).appendChild(s);
    }
  }, [slug, title]);

  return <div id="disqus_thread" className="mt-16"></div>;
};

const ShareButtons = ({ slug, title }: { slug: string; title: string }) => {
  const siteUrl = 'https://abrahamoflondon.org';
  const postUrl = encodeURIComponent(`${siteUrl}/blog/${slug}`);
  const postTitle = encodeURIComponent(title);

  return (
    <div className="flex space-x-4 mt-12">
      <a
        href={`https://twitter.com/intent/tweet?url=${postUrl}&text=${postTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:text-blue-700 font-semibold"
      >
        Share on Twitter
      </a>
      {/* Add other sharing buttons here if desired */}
    </div>
  );
};

export default function BlogPage({ post }: BlogPageProps) {
  const postUrl = `https://abrahamoflondon.org/blog/${post.slug}`;

  const components = {
    // Custom components to use within your MDX.
    // For example:
    // h1: (props: any) => <h1 className="text-4xl font-bold my-4" {...props} />,
    // p: (props: any) => <p className="mb-4" {...props} />,
    // img: (props: any) => <img className="my-4 rounded-lg" {...props} />,
  };

  return (
    <Layout>
      <Head>
        <title>{post.title} | Abraham of London</title>
        <meta name="description" content={post.description} />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:url" content={postUrl} />
        <meta property="og:type" content="article" />
        {post.image && <meta property="og:image" content={post.image} />}
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.description} />
        {post.image && <meta name="twitter:image" content={post.image} />}
        
        {/* Canonical URL */}
        <link rel="canonical" href={postUrl} />
      </Head>

      <article className="prose lg:prose-xl mx-auto my-8 p-4">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <p className="text-gray-600 mb-6">{post.date}</p>
        <div className="prose max-w-none">
          <MDXRemote {...post.content} components={components} />
        </div>
        <ShareButtons slug={post.slug} title={post.title} />
        <DisqusComments slug={post.slug} title={post.title} />
      </article>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPosts(['slug']);
  const paths = posts.map((post) => ({
    params: { slug: post.slug },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  // TypeScript knows getPostBySlug can return PostMeta | PostWithContent.
  // We need to tell it that in this specific case, it will be PostWithContent.
  const post = getPostBySlug(slug, [
    'title',
    'date',
    'slug',
    'author',
    'content', // Requesting content means it WILL be a string here
    'description',
    'image',
  ]) as PostWithContent; // <--- CRITICAL FIX: Assert type here

  const mdxSource = await serialize(post.content, {
    parseFrontmatter: true,
  });

  return {
    props: {
      post: {
        ...post,
        content: mdxSource,
      },
    },
  };
};