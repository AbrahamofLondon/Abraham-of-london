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
import SafeMDXRemote from "@/components/SafeMDXRemote";

type Props = { short: any; source: any };

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getPublishedShorts().map((s) => ({
    params: { slug: normalizeSlug(s) }
  }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  const short = getShortBySlug(slug);

  if (!short) return { notFound: true };

  try {
    const source = await serialize(short.body.raw, {
      mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] },
    });
    return { props: { short, source }, revalidate: 1800 };
  } catch (err) {
    const fallbackSource = await serialize("Short content is being optimized.");
    return { props: { short, source: fallbackSource }, revalidate: 1800 };
  }
};

const ShortPage: NextPage<Props> = ({ short, source }) => {
  const title = short.title ?? "Strategic Short";
  const cover = resolveDocCoverImage(short);

  return (
    <Layout title={title} ogImage={cover}>
      <Head>
        <title>{title} | Shorts | Abraham of London</title>
      </Head>
      <main className="mx-auto max-w-2xl px-6 py-20 lg:py-32">
        <header className="mb-12 border-b border-gold/10 pb-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">{short.theme || "Reflection"}</p>
          <h1 className="mt-4 font-serif text-4xl font-bold text-white sm:text-5xl">{title}</h1>
        </header>
        <article className="prose prose-invert prose-gold max-w-none prose-p:text-gray-300">
          <SafeMDXRemote source={source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default ShortPage;