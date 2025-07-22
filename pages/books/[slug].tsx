// pages/books/[slug].tsx

import React from 'react'; // Make sure React is imported if you're using JSX
import Layout from '../../components/Layout'; // Adjust path if needed
import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps, GetStaticPaths } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import type { ParsedUrlQuery } from 'querystring';


// Define your interfaces for books, similar to blog posts
interface BookPageProps {
  frontmatter: {
    title: string;
    date: string; // Or publication_date, etc.
    author: string;
    excerpt?: string;
    // Add any other frontmatter properties for your books (e.g., coverImage, isbn)
  };
  mdxSource: MDXRemoteSerializeResult;
}

interface BookParams extends ParsedUrlQuery {
  slug: string;
}

// Define custom components for MDX if you use them in your book MDX files
const components = {
  // p: (props: any) => <p className="mb-4 text-gray-700" {...props} />,
  // h1: (props: any) => <h1 className="text-3xl font-bold mb-4" {...props} />,
};

// getStaticPaths for books
export const getStaticPaths: GetStaticPaths<BookParams> = async () => {
  const fs = require('fs');
  const path = require('path');
  const booksDirectory = path.join(process.cwd(), 'content', 'books');
  const filenames = fs.readdirSync(booksDirectory);

  const paths = filenames.map((filename: string) => ({
    params: {
      slug: filename.replace(/\.mdx?$/, ''),
    },
  }));

  return {
    paths,
    fallback: false, // Or true, or 'blocking'
  };
};

// getStaticProps for books
export const getStaticProps: GetStaticProps<BookPageProps, BookParams> = async ({ params }) => {
  const { slug } = params!;

  const fs = require('fs');
  const path = require('path');
  const bookFilePath = path.join(process.cwd(), 'content', 'books', `${slug}.mdx`);
  const source = fs.readFileSync(bookFilePath, 'utf8');

  const { data, content } = require('gray-matter')(source);

  const mdxSource = await serialize(content, {
    scope: data,
    mdxOptions: {
      // Add plugins if you use them for books
    },
  });

  return {
    props: {
      frontmatter: data as BookPageProps['frontmatter'],
      mdxSource,
    },
  };
};


export default function BookPage({ frontmatter, mdxSource }: BookPageProps) {
  return ( // <--- *** THIS OPENING PARENTHESIS IS CRUCIAL ***
    <Layout>
      <Head>
        <title>{frontmatter.title} | Abraham of London Books</title>
        <meta name="description" content={frontmatter.excerpt || `Learn more about ${frontmatter.title}`} />
        {/* Add more meta tags specific to books */}
      </Head>

      <article className="max-w-3xl mx-auto py-8 px-4">
        {/* Book Header */}
        <h1 className="text-4xl md:text-5xl font-bold font-display leading-tight mb-4 text-primary">
          {frontmatter.title}
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          By {frontmatter.author}
          {frontmatter.date && ` on ${frontmatter.date}`}
        </p>

        {/* MDX Content */}
        <div className="prose lg:prose-lg max-w-none">
          <MDXRemote {...mdxSource} components={components} />
        </div>

        {/* Back to books list link */}
        <div className="mt-10 text-center">
          <Link href="/books">
            <a className="text-blue-600 hover:underline text-lg">← Back to books list</a>
          </Link>
        </div>
      </article>
    </Layout>
  ); // <--- *** THIS CLOSING PARENTHESIS AND SEMICOLON ARE CRUCIAL ***
}