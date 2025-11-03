// pages/books/[slug].tsx (FINAL ROBUST VERSION)
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";

import Layout from "@/components/Layout";
import mdxComponents from '@/components/mdx-components';
import { getAllBooks, getBookBySlug } from "@/lib/books"; 
import type { PostMeta } from "@/types/post"; // Using PostMeta as it matches

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
    mdxOptions: { remarkPlugins: [remarkGfm] },
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
    // ✅ FIX: Use 'blocking' to fix 404s
    fallback: 'blocking', 
  };
};y, value]) => value !== undefined)
        .map(([key, value]) => [key, value === undefined ? null : value])
    )
  };

  if (!content) {
    return { notFound: true };
  }

  const mdxSource = await serialize(content, { scope: frontmatter });

  return { 
    props: { source: mdxSource, frontmatter: frontmatter },
    revalidate: 3600,
  };
};

// ----------------------------------------------------
// Page Component 
// ----------------------------------------------------
export default function BookPage({ source, frontmatter }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Layout>
      <Head>
        <title>{frontmatter.title} by {frontmatter.author} | Abraham of London</title>
        <meta name="description" content={frontmatter.excerpt || frontmatter.title} />
      </Head>
      <article className="container mx-auto px-4 py-12">
        <header className="mb-10 flex flex-col items-start gap-6 md:flex-row">
          {frontmatter.coverImage && (
            <div className="relative w-full flex-shrink-0 overflow-hidden rounded-lg shadow-2xl md:w-80 aspect-[2/3]">
              <Image
                src={frontmatter.coverImage}
                alt={`Cover of ${frontmatter.title}`}
                width={1024}
                height={1536}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          )}
          <div className="flex-grow">
            <h1 className="mb-2 text-4xl font-serif font-bold text-deep-forest">{frontmatter.title}</h1>
            <p className="mb-4 text-xl text-soft-charcoal">
              By {frontmatter.author}
            </p>
          </div>
        </header>
        <section className="prose prose-lg max-w-none border-t border-gray-200 pt-8">
          <MDXRemote {...source} components={mdxComponents} />
        </section>
      </article>
    </Layout>
  );
}