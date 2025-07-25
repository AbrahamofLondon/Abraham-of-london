// pages/books/[slug].tsx
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { GetStaticPaths, GetStaticProps } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Layout from '../../components/Layout';
import Image from 'next/image';
import Head from 'next/head';

interface BookPageProps {
  source: MDXRemoteSerializeResult;
  frontMatter: {
    title: string;
    author: string;
    coverImage: string;
    description: string;
    date: string;
  };
}

const BookPage: React.FC<BookPageProps> = ({ source, frontMatter }) => {
  return (
    <Layout>
      <Head>
        <title>{frontMatter.title} | Abraham of London</title>
        <meta name="description" content={frontMatter.description} />
        <meta property="og:image" content={frontMatter.coverImage} />
      </Head>

      <article className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{frontMatter.title}</h1>
        <p className="text-gray-600 text-lg mb-6">By {frontMatter.author} • {frontMatter.date}</p>
        {frontMatter.coverImage && (
          <div className="mb-8">
            <Image
              src={frontMatter.coverImage}
              alt={frontMatter.title}
              width={800}
              height={500}
              className="rounded-lg shadow-md mx-auto"
            />
          </div>
        )}
        <div className="prose prose-lg max-w-none">
          <MDXRemote {...source} />
        </div>
      </article>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const dir = path.join(process.cwd(), 'content/books');
  const files = fs.readdirSync(dir);

  const paths = files
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => ({
      params: {
        slug: file.replace(/\.mdx$/, ''),
      },
    }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const filePath = path.join(process.cwd(), 'content/books', `${slug}.mdx`);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);

  const mdxSource = await serialize(content);

  return {
    props: {
      source: mdxSource,
      frontMatter: data,
    },
  };
};

export default BookPage;
