import * as React from "react";
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import Head from "next/head";
import Layout from "@/components/Layout";

import { getAllCanons } from "@/lib/contentlayer-helper";

import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";

type Props = { canon: any; source: MDXRemoteSerializeResult };

function docSlug(d: any): string {
  return (
    d?.slug ??
    d?._raw?.flattenedPath?.split("/").pop() ??
    ""
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const canons = getAllCanons();
  const paths = canons.map((d) => ({ params: { slug: docSlug(d) } }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim();
  if (!slug) return { notFound: true };

  const canons = getAllCanons();
  const canon = canons.find((d) => docSlug(d) === slug);
  if (!canon) return { notFound: true };

  const raw = canon?.body?.raw ?? "";
  const source = await serialize(raw, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
      ],
    },
  });

  return { props: { canon, source }, revalidate: 1800 };
};

const CanonPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  canon,
  source,
}) => {
  const title = canon.title ?? "Canon";
  return (
    <Layout title={title}>
      <Head>
        {canon.excerpt && <meta name="description" content={canon.excerpt} />}
        <meta property="og:title" content={title} />
        {canon.excerpt && <meta property="og:description" content={canon.excerpt} />}
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Canon
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            {title}
          </h1>
          {canon.excerpt ? <p className="text-sm text-gray-300">{canon.excerpt}</p> : null}
        </header>

        <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-cream prose-a:text-gold">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default CanonPage;