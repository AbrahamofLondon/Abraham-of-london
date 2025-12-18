import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { getAllPrints, getPrintBySlug } from "@/lib/contentlayer-helper";
import { serialize } from "next-mdx-remote/serialize";
import mdxComponents from "@/components/mdx-components";
import { MDXRemote } from "next-mdx-remote";

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllPrints().map((p) => ({
    params: { slug: p.slug }
  }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = String(params?.slug ?? "").toLowerCase().trim();
  const rawDoc = getPrintBySlug(slug);

  if (!rawDoc) return { notFound: true };

  const print = {
    title: rawDoc.title || "Exclusive Print",
    price: rawDoc.price || null,
    excerpt: rawDoc.excerpt || null,
  };

  try {
    const source = await serialize(rawDoc.body.raw);
    return { 
      props: { print, source: JSON.parse(JSON.stringify(source)) }, 
      revalidate: 1800 
    };
  } catch (err) {
    return { notFound: true };
  }
};

const PrintPage: NextPage<{print: any, source: any}> = ({ print, source }) => (
  <Layout title={print.title}>
    <main className="mx-auto max-w-3xl px-4 py-12 lg:py-20">
      <header className="mb-10 border-b border-gold/10 pb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold/70">Exclusive Print</p>
        <h1 className="font-serif text-4xl text-cream mt-4">{print.title}</h1>
        {print.price && <p className="text-lg text-gold mt-2">{print.price}</p>}
      </header>
      <article className="prose prose-invert max-w-none">
        <MDXRemote {...source} components={mdxComponents} />
      </article>
    </main>
  </Layout>
);

export default PrintPage;