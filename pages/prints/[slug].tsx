/* Institutional Print Collection Detail */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { 
  getAllPrints, 
  getPrintBySlug, 
  normalizeSlug, 
  resolveDocCoverImage 
} from '@/lib/contentlayer';
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import mdxComponents from "@/components/mdx-components";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { ShoppingBag, Ruler, CheckCircle, XCircle } from "lucide-react";

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

  const mdxContent = (doc as any).body?.raw || (doc as any).content || "";

  const print = {
    title: (doc as any).title || "Exclusive Print",
    excerpt: (doc as any).excerpt ?? null,
    description: (doc as any).description ?? (doc as any).excerpt ?? null,
    price: (doc as any).price ?? null,
    dimensions: (doc as any).dimensions ?? null,
    coverImage: resolveDocCoverImage(doc),
    slug,
    available: (doc as any).available !== false,
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
        <title>{print.title} | Print Collection | Abraham of London</title>
        {print.description && <meta name="description" content={print.description} />}
      </Head>

      <main className="mx-auto max-w-5xl px-6 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* IMAGE SECTION */}
          <div className="relative group">
            <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-black border border-white/5 shadow-2xl">
              {print.coverImage ? (
                <img 
                  src={print.coverImage} 
                  alt={print.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gold/20 italic font-serif">
                  Image Pending
                </div>
              )}
            </div>
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 pointer-events-none" />
          </div>

          {/* CONTENT SECTION */}
          <section>
            <div className="mb-8 border-b border-white/5 pb-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold/70">
                Institutional Print Collection
              </span>
              <h1 className="mt-4 font-serif text-5xl font-bold text-cream tracking-tight leading-tight">
                {print.title}
              </h1>
              {print.price && (
                <p className="mt-6 text-3xl text-gold font-serif italic tracking-wide">
                  {print.price}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-6 mb-10">
              <div className="flex items-center gap-4 text-gray-400">
                <Ruler className="h-5 w-5 text-gold/40" />
                <span className="text-sm tracking-wide font-mono uppercase">
                  Dimensions: <span className="text-cream">{print.dimensions || "Custom Size"}</span>
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                {print.available ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500/60" />
                    <span className="text-xs font-bold uppercase tracking-widest text-green-400">Currently Available</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500/60" />
                    <span className="text-xs font-bold uppercase tracking-widest text-red-400">Sold Out</span>
                  </>
                )}
              </div>
            </div>

            <article className="prose prose-invert prose-md max-w-none prose-headings:font-serif prose-headings:text-gold/90 prose-headings:mt-8 mb-12">
              <MDXRemote {...source} components={mdxComponents} />
            </article>

            {print.available && (
              <button className="w-full flex items-center justify-center gap-3 bg-cream text-black py-5 rounded-full text-sm font-bold uppercase tracking-widest transition-all hover:bg-gold hover:shadow-2xl hover:shadow-gold/20 active:scale-95">
                <ShoppingBag className="h-4 w-4" />
                Enquire for Acquisition
              </button>
            )}
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default PrintPage;
