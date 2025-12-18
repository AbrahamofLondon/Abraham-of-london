import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { getAllCanons, normalizeSlug, isDraft } from "@/lib/contentlayer-helper";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";
import { MDXRemote } from "next-mdx-remote";

type Props = { canon: any; source: any };
const SITE = "https://www.abrahamoflondon.org";

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllCanons()
    .filter((d) => !isDraft(d))
    .map((d) => ({ params: { slug: normalizeSlug(d) } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  const rawCanon = getAllCanons().find((d) => normalizeSlug(d) === slug);

  if (!rawCanon || isDraft(rawCanon)) return { notFound: true };

  const canon = {
    title: rawCanon.title || "Canon",
    subtitle: rawCanon.subtitle || null,
    volumeNumber: rawCanon.volumeNumber || null,
    excerpt: rawCanon.excerpt || null,
    slug: slug,
    coverImage: rawCanon.coverImage || null,
  };

  try {
    const source = await serialize(rawCanon.body.raw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
      },
    });

    return { 
      props: { 
        canon, 
        source: JSON.parse(JSON.stringify(source)) 
      }, 
      revalidate: 1800 
    };
  } catch (e) {
    console.error(`[Build Error] Serialization failed for canon: ${slug}`);
    return { notFound: true };
  }
};

const CanonPage: NextPage<Props> = ({ canon, source }) => {
  const title = canon.title;
  const canonicalUrl = `${SITE}/canon/${canon.slug}`;

  return (
    <Layout title={title} description={canon.excerpt || ""} canonicalUrl={canonicalUrl} ogType="article">
      <Head><link rel="canonical" href={canonicalUrl} /></Head>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-8 border-b border-gold/10 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">The Canon</p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">{title}</h1>
        </header>
        <article className="prose prose-invert max-w-none">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default CanonPage;