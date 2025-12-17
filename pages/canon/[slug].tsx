import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { 
  getAllCanons, 
  getCanonBySlug,
  normalizeSlug 
} from "@/lib/contentlayer-helper";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";
import SafeMDXRemote from "@/components/SafeMDXRemote";

type Props = { canon: any; source: any };

export const getStaticPaths: GetStaticPaths = async () => {
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
  const canon = getCanonBySlug(slug);

  if (!canon) return { notFound: true };

  try {
    const source = await serialize(canon.body.raw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
      },
    });
    return { props: { canon, source }, revalidate: 1800 };
  } catch (err) {
    const fallbackSource = await serialize("Vault volume is being initialized.");
    return { props: { canon, source: fallbackSource }, revalidate: 1800 };
  }
};

const CanonPage: NextPage<Props> = ({ canon, source }) => {
  const title = canon.title ?? "Canon Volume";
  return (
    <Layout title={title}>
      <Head>
        <title>{title} | The Canon | Abraham of London</title>
        {canon.excerpt && <meta name="description" content={canon.excerpt} />}
      </Head>

      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16 lg:py-24">
        <header className="mb-12 space-y-4 border-b border-gold/10 pb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1">
             <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">The Canon</span>
          </div>
          <h1 className="font-serif text-4xl font-semibold text-cream sm:text-5xl lg:text-6xl">{title}</h1>
          {canon.subtitle && <p className="text-xl text-gray-400 font-light italic leading-relaxed">{canon.subtitle}</p>}
        </header>

        <article className="prose prose-invert prose-gold max-w-none prose-headings:font-serif prose-headings:text-cream prose-p:text-gray-300 prose-a:text-gold prose-strong:text-gold/90">
          <SafeMDXRemote source={source} components={mdxComponents} />
        </article>

        <footer className="mt-20 border-t border-white/5 pt-10">
           <p className="text-[10px] font-mono uppercase tracking-widest text-gray-600">Abraham of London · Private Library</p>
        </footer>
      </main>
    </Layout>
  );
};

export default CanonPage;