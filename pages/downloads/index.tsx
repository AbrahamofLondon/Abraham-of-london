// pages/downloads/index.tsx
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { getAllDownloads } from "@/lib/downloads";

// Define local types since they might not be exported from lib/downloads
interface DownloadMeta {
  slug: string;
  title: string;
  excerpt?: string;
  date?: string;
  url?: string;
  downloadFile?: string;
  fileUrl?: string;
}

interface DownloadsIndexProps {
  downloads: DownloadMeta[];
}

export const getStaticProps: GetStaticProps<DownloadsIndexProps> = async () => {
  try {
    const downloads = getAllDownloads();
    return {
      props: {
        downloads: downloads || [],
      },
    };
  } catch (error) {
    console.error('Error in downloads index page:', error);
    return {
      props: {
        downloads: [],
      },
    };
  }
};

const DownloadsIndexPage: NextPage<DownloadsIndexProps> = ({ downloads }) => {
  const title = "Downloads";
  const description = "Curated tools, cue cards, briefs, and print-ready resources from Abraham of London.";

  return (
    <Layout title={`${title} | Abraham of London`} description={description}>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={description} />
      </Head>

      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <header className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-forest/70">
            Abraham of London · Resources
          </p>
          <h1 className="mt-3 mb-4 font-serif text-4xl font-semibold text-deepCharcoal md:text-5xl">
            Downloads & Print Resources
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-gray-600">
            A growing library of battle-tested cue cards, briefs, and print
            templates for fathers, founders, and strategic leaders.
          </p>
        </header>

        {downloads.length > 0 ? (
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-deepCharcoal">
              Core Downloads
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {downloads.map((dl) => {
                const href = dl.url || `/downloads/${dl.slug}`;
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
                    <div className="mt-4 flex flex-1 items-end">
                      <Link
                        href={href}
                        className="inline-flex items-center rounded-full bg-forest px-4 py-2 text-sm font-semibold text-cream hover:bg-forest/90"
                      >
                        View Details
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No downloads available yet.</p>
          </div>
        )}
      </main>
    </Layout>
  );
};

export default DownloadsIndexPage;