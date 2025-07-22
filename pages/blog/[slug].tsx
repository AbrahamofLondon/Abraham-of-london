// pages/blog/[slug].tsx
import React from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';

import type { ParsedUrlQuery } from 'querystring'; // Import this type

// --- START: Interface Definitions (MUST BE AT THE TOP) ---

// Define the props type for your PostPage component
interface PostPageProps {
  frontmatter: {
    title: string;
    date: string;
    author: string;
    tags: string[];
    excerpt?: string; // Optional excerpt
  };
  mdxSource: MDXRemoteSerializeResult;
}

// Define the interface for the parameters expected by getStaticPaths and getStaticProps
interface PostParams extends ParsedUrlQuery {
  slug: string; // Your dynamic route parameter
}

// --- END: Interface Definitions ---


// Define custom components available in MDX.
// This block should also be near the top, after imports and type definitions.
const components = {
  // Example: Apply Tailwind CSS classes to standard HTML elements rendered by MDX
  // p: (props: any) => <p className="mb-4 leading-relaxed text-gray-800" {...props} />,
  // h1: (props: any) => <h1 className="text-4xl font-bold mt-8 mb-4 text-primary" {...props} />,
  // h2: (props: any) => <h2 className="text-3xl font-semibold mt-6 mb-3 text-secondary" {...props} />,
  // You can also add your own custom React components here if you use them in MDX, e.g.:
  // MyCustomComponent: (props: any) => <YourActualCustomComponent {...props} />,
};


// getStaticPaths - Generates all static paths for blog posts
export const getStaticPaths: GetStaticPaths<PostParams> = async () => {
  const fs = require('fs');
  const path = require('path');
  const postsDirectory = path.join(process.cwd(), 'content', 'blog');
  const filenames = fs.readdirSync(postsDirectory);

  const paths = filenames.map((filename: string) => ({
    params: {
      slug: filename.replace(/\.mdx?$/, ''),
    },
  }));

  return {
    paths,
    fallback: false, // Or true, or 'blocking', depending on your Next.js setup
  };
};

// getStaticProps - Fetches data for each individual blog post
export const getStaticProps: GetStaticProps<PostPageProps, PostParams> = async ({ params }) => {
  const { slug } = params!;

  const fs = require('fs');
  const path = require('path');
  const postFilePath = path.join(process.cwd(), 'content', 'blog', `${slug}.mdx`);
  const source = fs.readFileSync(postFilePath, 'utf8');

  const { data, content } = require('gray-matter')(source);

  const mdxSource = await serialize(content, {
    scope: data,
    mdxOptions: {
      // remarkPlugins: [require('remark-prism')],
      // rehypePlugins: [require('rehype-code-titles')],
    },
  });

  return {
    props: {
      frontmatter: data as PostPageProps['frontmatter'],
      mdxSource,
    },
  };
};

// --- START: PostPage Component ---
export default function PostPage({ frontmatter, mdxSource }: PostPageProps) {
  return (
    <Layout>
      <Head>
        <title>{frontmatter.title} | Abraham of London Blog</title>
        <meta name="description" content={frontmatter.excerpt || `Read about ${frontmatter.title}`} />
        {/* Add more meta tags as needed */}
      </Head>

      <article className="max-w-3xl mx-auto py-8 px-4">
        {/* Post Header */}
        <h1 className="text-4xl md:text-5xl font-bold font-display leading-tight mb-4 text-primary">
          {frontmatter.title}
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          By {frontmatter.author} on {frontmatter.date}
        </p>

        {/* MDX Content */}
        <div className="prose lg:prose-lg max-w-none">
          {/* Ensure 'components' is defined before this point */}
          <MDXRemote {...mdxSource} components={components} />
        </div>

        {/* Back to Blog Link */}
        <div className="mt-10 text-center">
          <Link href="/blog">
            <a className="text-blue-600 hover:underline text-lg">← Back to Blog Posts</a>
          </Link>
        </div>
      </article>
    </Layout>
  );
}