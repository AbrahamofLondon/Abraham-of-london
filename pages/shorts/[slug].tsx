import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { getPublishedShorts, getShortBySlug, normalizeSlug, resolveDocCoverImage } from "@/lib/contentlayer-helper";
import { serialize } from "next-mdx-remote/serialize";
import mdxComponents from "@/components/mdx-components";
import { MDXRemote } from "next-mdx-remote";
import Layout from "@/components/Layout";

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getPublishedShorts().map((s) => ({ params: { slug: normalizeSlug(s) } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = String(params?.slug ?? "").toLowerCase().trim();
  const rawDoc = getShortBySlug(slug);

  if (!rawDoc) return { notFound: true };

  const short = JSON.parse(JSON.stringify({
    ...rawDoc,
    cover: resolveDocCoverImage(rawDoc)
  }));

  try {
    const source = await serialize(short.body.raw);
    return { props: { short, source }, revalidate: 1800 };
  } catch (err) {
    return { notFound: true };
  }
};

const ShortPage: NextPage<{short: any, source: any}> = ({ short, source }) => (
  <Layout title={short.title} ogImage={short.cover}>
    <main className="mx-auto max-w-2xl px-6 py-20">
      <header className="mb-12 border-b border-gold/10 pb-10 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-gold">{short.theme || "Reflection"}</p>
        <h1 className="mt-4 font-serif text-4xl text-white">{short.title}</h1>
      </header>
      <article className="prose prose-invert max-w-none">
        <MDXRemote {...source} components={mdxComponents} />
      </article>
    </main>
  </Layout>
);

export default ShortPage;