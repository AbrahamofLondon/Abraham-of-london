import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { 
  getAllCanons, 
  getDocHref, 
  normalizeSlug, 
  isPublished 
} from "@/lib/contentlayer-helper";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";
import SafeMDXRemote from "@/components/SafeMDXRemote";

type Props = { canon: any; source: any };

export const getStaticPaths: GetStaticPaths = async () => {
  // Use the helper to get all canons (published)
  const canons = getAllCanons();
  
  const paths = canons
    .map((doc) => {
      const slug = normalizeSlug(doc);
      return slug ? { params: { slug } } : null;
    })
    .filter(Boolean) as { params: { slug: string } }[];

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  
  // Find the canon using the helper's normalizeSlug logic to ensure a match
  const canons = getAllCanons();
  const canon = canons.find((d) => normalizeSlug(d) === slug);

  if (!canon) {
    return { notFound: true };
  }

  const raw = String(canon?.body?.raw ?? "");
  let source;
  
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
  } catch (err) {
    source = await serialize("Content is being prepared.");
  }

  return { props: { canon, source }, revalidate: 1800 };
};

const CanonPage: NextPage<Props> = ({ canon, source }) => {
  const title = canon.title ?? "Canon";
  return (
    <Layout title={title}>
      <Head>
        <title>{title}</title>
        {canon.excerpt && <meta name="description" content={canon.excerpt} />}
      </Head>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">Canon</p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">{title}</h1>
          {canon.subtitle && <p className="text-lg text-gray-300">{canon.subtitle}</p>}
        </header>
        <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-cream prose-a:text-gold">
          <SafeMDXRemote source={source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default CanonPage;