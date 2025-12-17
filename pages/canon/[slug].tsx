import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";

import { getAllCanons, normalizeSlug, isDraft } from "@/lib/contentlayer-helper";

import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";
import SafeMDXRemote from "@/components/SafeMDXRemote";

type Props = { canon: any; source: MDXRemoteSerializeResult };

const SITE = "https://www.abrahamoflondon.org";

export const getStaticPaths: GetStaticPaths = async () => {
  const canons = getAllCanons().filter((d: any) => !isDraft(d));

  const paths = canons
    .map((d: any) => normalizeSlug(d))
    .filter(Boolean)
    .map((slug: string) => ({ params: { slug } }));

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  if (!slug) return { notFound: true };

  const canons = getAllCanons().filter((d: any) => !isDraft(d));
  const canon = canons.find((d: any) => normalizeSlug(d) === slug);
  if (!canon) return { notFound: true };

  const raw = String(canon?.body?.raw ?? "");

  let source: MDXRemoteSerializeResult;
  try {
    source = await serialize(raw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
      },
    });
  } catch {
    source = await serialize("Content is being prepared.");
  }

  return { props: { canon, source }, revalidate: 1800 };
};

const CanonPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ canon, source }) => {
  const title = String(canon?.title ?? "Canon");
  const desc = String(canon?.description ?? canon?.excerpt ?? "");
  const canonicalUrl = `${SITE}/canon/${normalizeSlug(canon)}`;

  return (
    <Layout title={title} description={desc} canonicalUrl={canonicalUrl} ogImage={canon?.coverImage ?? undefined} ogType="article">
      <Head>
        <link rel="canonical" href={canonicalUrl} />
        {canon?.excerpt ? <meta name="description" content={canon.excerpt} /> : null}
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">Canon</p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">{title}</h1>
          {canon?.excerpt ? <p className="text-sm text-gray-300">{canon.excerpt}</p> : null}
        </header>

        <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-cream prose-a:text-gold">
          <SafeMDXRemote source={source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default CanonPage;