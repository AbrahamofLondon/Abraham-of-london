import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { 
  getPublishedShorts, 
  getShortBySlug, 
  normalizeSlug, 
  resolveDocCoverImage 
} from "@/lib/contentlayer-helper";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import mdxComponents from "@/components/mdx-components";
import { MDXRemote } from "next-mdx-remote";

type Props = { 
  short: any; 
  source: any;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const shorts = getPublishedShorts();
  const paths = shorts.map((s) => ({
    params: { slug: normalizeSlug(s) }
  }));
  
  return { 
    paths, 
    // Set to false for absolute static safety on Netlify 
    // unless you plan to add content without re-deploying.
    fallback: false 
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  const shortDoc = getShortBySlug(slug);

  if (!shortDoc) return { notFound: true };

  try {
    // Extract only the raw body to avoid serializing complex Contentlayer objects
    const content = shortDoc.body?.raw || shortDoc.content || "";
    
    const mdxSource = await serialize(content, {
      mdxOptions: { 
        remarkPlugins: [remarkGfm], 
        rehypePlugins: [rehypeSlug] 
      },
      // This ensures frontmatter isn't accidentally re-parsed inside the body
      parseFrontmatter: false 
    });

    return { 
      props: { 
        // Create a plain object to avoid Next.js serialization errors
        short: JSON.parse(JSON.stringify(shortDoc)), 
        source: mdxSource 
      }, 
      revalidate: 1800 
    };
  } catch (err) {
    console.error(`[Build Error] MDX Serialization failed for: ${slug}`, err);
    return { notFound: true };
  }
};

const ShortPage: NextPage<Props> = ({ short, source }) => {
  const title = short.title ?? "Strategic Short";
  const cover = resolveDocCoverImage(short);

  return (
    <Layout title={title} ogImage={cover}>
      <Head>
        <title>{title} | Shorts | Abraham of London</title>
        <meta name="description" content={short.excerpt || title} />
      </Head>
      
      <main className="mx-auto max-w-2xl px-6 py-20 lg:py-32">
        <header className="mb-12 border-b border-gold/10 pb-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">
            {short.theme || short.category || "Reflection"}
          </p>
          <h1 className="mt-4 font-serif text-4xl font-bold text-white sm:text-5xl leading-tight">
            {title}
          </h1>
          {short.readTime && (
            <span className="mt-2 block text-xs text-gray-500 uppercase tracking-widest">
              {short.readTime} Read
            </span>
          )}
        </header>

        <article className="prose prose-invert prose-gold max-w-none prose-p:text-gray-300 prose-hr:border-gold/20">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default ShortPage;