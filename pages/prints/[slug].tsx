// pages/prints/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import Layout from "@/components/Layout";
import type { PrintDocument } from "@/lib/prints";
import { getAllPrintSlugs, getPrintDocumentBySlug } from "@/lib/prints";
import mdxComponents from "@/components/mdx-components";

type PrintPageProps = {
  print: PrintDocument;
  contentSource: MDXRemoteSerializeResult | null;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getAllPrintSlugs();
  const paths = slugs.map((slug) => ({ params: { slug } }));

  return {
    paths,
    fallback: false, // all prints are known at build time
  };
};

export const getStaticProps: GetStaticProps<PrintPageProps> = async ({
  params,
}) => {
  const slug = params?.slug as string | undefined;
  if (!slug) return { notFound: true };

  const doc = getPrintDocumentBySlug(slug);
  if (!doc) return { notFound: true };

  // Plain JSON copy for safety in serialization / props
  const print: PrintDocument = JSON.parse(JSON.stringify(doc));

  // Contentlayer stores MDX source on body.raw
  const rawMdx: string = (doc as any).body?.raw ?? "";

  const contentSource =
    rawMdx.trim().length > 0
      ? await serialize(rawMdx, {
          // Allow access to front-matter fields inside MDX if needed
          scope: { ...print },
        })
      : null;

  return {
    props: {
      print,
      contentSource,
    },
    revalidate: 3600,
  };
};

export default function PrintPage({ print, contentSource }: PrintPageProps) {
  const { title, slug, date, excerpt, tags } = print;

  const displayDate = date
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(date))
    : null;

  const metaDescription =
    excerpt ||
    "Premium printable framework for fathers, founders, and leaders.";

  const canonical = `https://www.abrahamoflondon.org/prints/${slug}`;

  return (
    <Layout title={title}>
      <Head>
        <title>{`${title} | Abraham of London – Printables`}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonical} />
      </Head>

      <div className="relative min-h-screen bg-gradient-to-br from-black via-[#050608] to-[#111827] py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-24 h-64 w-64 rounded-full bg-softGold/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-16 h-72 w-72 rounded-full bg-forest/15 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-4">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm text-slate-300/80">
            <Link href="/" className="hover:text-softGold">
              Home
            </Link>
            <span className="mx-2 text-softGold/60">/</span>
            <Link href="/content" className="hover:text-softGold">
              Content Hub
            </Link>
            <span className="mx-2 text-softGold/60">/</span>
            <Link href="/content?filter=print" className="hover:text-softGold">
              Printables
            </Link>
            <span className="mx-2 text-softGold/60">/</span>
            <span className="text-softGold">{title}</span>
          </nav>

          {/* Header */}
          <header className="mb-10 rounded-3xl border border-softGold/30 bg-black/60 px-6 py-8 shadow-2xl shadow-black/50 backdrop-blur-xl sm:px-10 sm:py-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-softGold/10 px-4 py-1 text-xs font-semibold tracking-[0.22em] text-softGold">
              <span className="h-1.5 w-1.5 rounded-full bg-softGold" />
              PRINTABLE
            </div>

            <h1 className="mb-4 max-w-3xl font-serif text-3xl font-light text-slate-50 sm:text-4xl lg:text-5xl">
              {title}
            </h1>

            {excerpt && (
              <p className="max-w-2xl text-base text-slate-200 sm:text-lg">
                {excerpt}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-300/80">
              {displayDate && (
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-softGold/70" />
                  {displayDate}
                </span>
              )}
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-600/70 bg-slate-900/60 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-200"
                    >
                      {String(tag)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* Body */}
          <article className="rounded-3xl border border-slate-700/70 bg-[#050608]/95 px-5 py-8 text-slate-100 shadow-2xl shadow-black/60 sm:px-10 sm:py-10">
            {contentSource ? (
              <div
                className="prose-lux"
                >

                <MDXRemote {...contentSource} components={mdxComponents} />
              </div>
            ) : (
              <p className="text-slate-200">
                This printable is coming online shortly. Check back soon.
              </p>
            )}

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6 text-sm text-slate-300/90">
              <p>
                Ready to use this? Print, laminate, and keep it in your line of
                sight.
              </p>
              <Link
                href="/downloads"
                className="inline-flex items-center gap-2 rounded-full border border-softGold/60 bg-softGold/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-softGold hover:bg-softGold/25"
              >
                View Related Downloads
              </Link>
            </div>
          </article>
        </div>
      </div>
    </Layout>
  );
}