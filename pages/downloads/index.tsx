// pages/downloads/index.tsx
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import {
  getAllDownloads,
  type DownloadMeta,
  getAllPrints,
  type PrintMeta,
} from "@/lib/downloads";

interface DownloadsIndexProps {
  downloads: DownloadMeta[];
  prints: PrintMeta[];
}

export const getStaticProps: GetStaticProps<DownloadsIndexProps> = async () => {
  const downloads = getAllDownloads();
  const prints = getAllPrints();

  return {
    props: {
      downloads,
      prints,
    },
  };
};

const DownloadsIndexPage: NextPage<DownloadsIndexProps> = ({
  downloads,
  prints,
}) => {
  const title = "Downloads";
  const description =
    "Curated tools, cue cards, briefs, and print-ready resources from Abraham of London.";

  return (
    <Layout title={`${title} | Abraham of London`} description={description}>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${title} | Abraham of London`} />
        <meta property="og:description" content={description} />
      </Head>

      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        {/* Header */}
        <header className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-forest/70">
            Abraham of London · Resources
          </p>
          <h1 className="mt-3 mb-4 font-serif text-4xl font-semibold text-deepCharcoal md:text-5xl">
            Downloads & Print Resources
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-gray-600">
            A growing library of battle-tested cue cards, briefs, and print
            templates for fathers, founders, and strategic leaders. Most
            resources are designed to be printed, carried, and used in real
            conversations.
          </p>
        </header>

        {/* Primary downloads grid */}
        {downloads.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-deepCharcoal">
              Core Downloads
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {downloads.map((dl) => {
                const href =
                  dl.url ||
                  `/downloads/${dl.slug}` ||
                  dl.downloadFile ||
                  dl.fileUrl;

                return (
                  <article
                    key={dl.slug}
                    className="flex h-full flex-col rounded-2xl border border-lightGrey bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
                  >
                    <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-forest/70">
                      Download
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-deepCharcoal">
                      {dl.title}
                    </h3>
                    {dl.excerpt && (
                      <p className="mt-2 text-sm text-slate-700">
                        {dl.excerpt}
                      </p>
                    )}
                    {dl.date && (
                      <p className="mt-2 text-xs text-slate-500">
                        {new Date(dl.date).toLocaleDateString("en-GB")}
                      </p>
                    )}
                    <div className="mt-4 flex flex-1 items-end">
                      <Link
                        href={href}
                        className="inline-flex items-center rounded-full bg-forest px-4 py-2 text-sm font-semibold text-cream hover:bg-forest/90"
                      >
                        Download PDF
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Print-ready layouts */}
        {prints.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-deepCharcoal">
              Print-Ready Layouts
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {prints.map((pr) => {
                const href = pr.url || pr.downloadFile || `/prints/${pr.slug}`;
                return (
                  <article
                    key={pr.slug}
                    className="flex h-full flex-col rounded-2xl border border-lightGrey bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
                  >
                    <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-forest/70">
                      Print
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-deepCharcoal">
                      {pr.title}
                    </h3>
                    {pr.excerpt && (
                      <p className="mt-2 text-sm text-slate-700">
                        {pr.excerpt}
                      </p>
                    )}
                    {pr.dimensions && (
                      <p className="mt-2 text-xs text-slate-500">
                        Format: {pr.dimensions}
                      </p>
                    )}
                    <div className="mt-4 flex flex-1 items-end">
                      <Link
                        href={href}
                        className="inline-flex items-center rounded-full border border-forest px-4 py-2 text-sm font-semibold text-forest hover:bg-forest hover:text-cream"
                      >
                        View / Download
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Fallback guidance */}
        <section className="mt-10 rounded-2xl border border-lightGrey bg-white p-6 text-sm text-gray-700">
          <h2 className="mb-2 text-base font-semibold text-deepCharcoal">
            Looking for something specific?
          </h2>
          <p>
            Some resources are linked directly from{" "}
            <Link href="/blog" className="font-medium text-forest hover:underline">
              key blog posts
            </Link>{" "}
            and{" "}
            <Link
              href="/books"
              className="font-medium text-forest hover:underline"
            >
              book pages
            </Link>
            . If you can&apos;t find what you need,{" "}
            <Link
              href="/contact"
              className="font-medium text-forest hover:underline"
            >
              send a note
            </Link>{" "}
            and we&apos;ll point you to the right asset.
          </p>
        </section>
      </main>
    </Layout>
  );
};

export default DownloadsIndexPage;