// pages/canon/[slug].tsx
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

import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";
import SafeMDXRemote from "@/components/SafeMDXRemote";

type Props = { canon: any; source: MDXRemoteSerializeResult };

function docSlug(d: any): string {
  return d?.slug ?? d?._raw?.flattenedPath?.split("/").pop() ?? "";
}

/* -------------------------------------------------------------------------- */
/* ✅ REQUIRED FOR DYNAMIC SSG ROUTES                                          */
/* -------------------------------------------------------------------------- */
export const getStaticPaths: GetStaticPaths = async () => {
  const canons = getAllCanons();

  const paths = canons
    .map((d) => {
      const slug = docSlug(d);
      return slug ? { params: { slug } } : null;
    })
    .filter(Boolean) as { params: { slug: string } }[];

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim();
  if (!slug) return { notFound: true };

  const canons = getAllCanons();
  const canon = canons.find((d) => docSlug(d) === slug);
  if (!canon) return { notFound: true };

  const raw = String(canon?.body?.raw ?? "");

  let source: MDXRemoteSerializeResult;
  try {
    source = await serialize(raw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ],
      },
    });
  } catch {
    // Never crash export/build because one MDX file is malformed
    source = await serialize("Content is being prepared.");
  }

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
        {canon.excerpt ? <meta name="description" content={canon.excerpt} /> : null}
        <meta property="og:title" content={title} />
        {canon.excerpt ? <meta property="og:description" content={canon.excerpt} /> : null}
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Canon
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            {title}
          </h1>
          {canon.excerpt ? (
            <p className="text-sm text-gray-300">{canon.excerpt}</p>
          ) : null}
        </header>

        <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-cream prose-a:text-gold">
          <SafeMDXRemote source={source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default CanonPage;