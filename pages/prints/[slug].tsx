import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { 
  getAllPrints, 
  getPrintBySlug, 
  normalizeSlug,
  resolveDocCoverImage 
} from "@/lib/contentlayer-helper";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import mdxComponents from "@/components/mdx-components";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { ShoppingBag } from "lucide-react";

type Props = {
  print: {
    title: string;
    excerpt: string | null;
    description: string | null;
    price: string | null;
    dimensions: string | null;
    coverImage: string | null;
    slug: string;
    available: boolean;
  };
  source: MDXRemoteSerializeResult;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const prints = getAllPrints();

  // Filter out drafts and ensure strictly typed paths
  const paths = prints
    .filter((p: any) => p?.draft !== true)
    .map((p: any) => ({ params: { slug: normalizeSlug(p) } }))
    .filter((p) => p.params.slug && p.params.slug.length > 0);

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  if (!slug) return { notFound: true };

  const doc = getPrintBySlug(slug);
  if (!doc || (doc as any)?.draft === true) return { notFound: true };

  // MDX content: allow empty bodies safely
  const mdxContent =
    typeof (doc as any).body?.raw === "string"
      ? String((doc as any).body.raw)
      : typeof (doc as any).content === "string"
      ? String((doc as any).content)
      : "";

  const print = {
    title: (doc as any).title || "Exclusive Print",
    excerpt: (doc as any).excerpt ?? null,
    description: (doc as any).description ?? (doc as any).excerpt ?? null,
    price: (doc as any).price ?? null,
    dimensions: (doc as any).dimensions ?? null,
    coverImage: resolveDocCoverImage(doc),
    slug,
    available: (doc as any).available !== false, // Default to true if undefined
  };

  const source = await serialize(mdxContent || " ", {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug],
    },
  });

  return { props: { print, source }, revalidate: 3600 };
};

const PrintPage: NextPage<Props> = ({ print, source }) => {
  return (
    <Layout title={print.title}>
      <Head>
        <title>{print.title} | Prints | Abraham of London</title>
        {print.description && <meta name="description" content={print.description} />}
        {print.coverImage && (
          <>
            <meta property="og:image" content={print.coverImage} />
            <meta name="twitter:image" content={print.coverImage} />
          </>
        )}
      </Head>

      <main className="mx-auto max-w-4xl px-6 py-20 lg:py-28">
        <header className="mb-12 border-b border-gold/10 pb-10 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 ring-1 ring-gold/20">
              <ShoppingBag className="h-6 w-6 text-gold" aria-hidden="true" />
            </div>
          </div>
          
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold/70">
            Exclusive Print Collection
          </p>

          <h1 className="mt-4 font-serif text-4xl font-semibold text-cream sm:text-5xl">
            {print.title}
          </h1>

          {print.price && (
            <p className="mt-4 text-2xl text-gold font-serif italic">
              {print.price}
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            {print.dimensions && (
              <span className="rounded-full border border-white/10 px-3 py-1">
                {print.dimensions}
              </span>
            )}
            {print.available ? (
              <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-green-400">
                Available
              </span>
            ) : (
              <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-red-400">
                Sold Out
              </span>
            )}
          </div>
        </header>

        <article className="prose prose-invert prose-lg mx-auto">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default PrintPage;