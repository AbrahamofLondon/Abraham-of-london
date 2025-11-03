// pages/books/[slug].tsx (FINAL ROBUST VERSION)
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";

import Layout from "@/components/Layout";
import mdxComponents from '@/components/mdx-components';
import { getAllBooks, getBookBySlug } from "@/lib/books"; 
import type { PostMeta } from "@/types/post"; 

type Props = { 
  book: PostMeta; 
  source: MDXRemoteSerializeResult 
};

export default function BookPage({ book, source }: Props) {
  if (!book) return <div>Book not found.</div>;
  
  const { title, description, ogDescription, coverImage, slug } = book;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
  const url = `${site}/books/${slug}`;
  const absImage = coverImage ? new URL(coverImage, site).toString() : undefined;

  return (
    <Layout pageTitle={title}>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={description || ogDescription || ""} />
        {absImage && <meta property="og:image" content={absImage} />}
        <meta property="og:url" content={url} />
      </Head>
      
      <article className="prose prose-lg mx-auto px-4 py-10">
        <h1>{title}</h1>
        <MDXRemote {...source} components={mdxComponents} />
      </article>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");
  const { content, ...book } = getBookBySlug(slug);

  if (!book || !content) {
    return { notFound: true };
  }

  const source = await serialize(content, {
    parseFrontmatter: false,
    scope: book,
    mdxOptions: { remarkPlugins: [remarkGfm as any] }, 
  });

  return { 
    props: { 
      book: JSON.parse(JSON.stringify(book)), 
      source 
    },
    revalidate: 3600
  };
}; 

export const getStaticPaths: GetStaticPaths = async () => {
  const books = getAllBooks(["slug"]);
  return {
    paths: books.map((b) => ({
      params: { slug: b.slug },
    })),
    fallback: 'blocking', 
  };
};