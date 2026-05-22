import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import {
  formatEditorialSeriesPartNumber,
  getEditorialSeriesBySlug,
  getEditorialSeriesCatalogue,
  type EditorialSeries,
} from "@/lib/editorial/series";

type Props = {
  series: EditorialSeries;
};

const EditorialSeriesHub: NextPage<Props> = ({ series }) => {
  return (
    <Layout
      title={`${series.title} | Editorial Series | Abraham of London`}
      description={series.descriptor}
      canonicalUrl={`/editorials/series/${series.slug}`}
      fullWidth
      headerTransparent
      className="ds-surface-essays"
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="mind-clay-hub min-h-screen px-6 pb-24 pt-28 lg:px-10 lg:pb-28 lg:pt-36">
        <section className="mx-auto max-w-5xl">
          <header className="max-w-3xl">
            <p className="mind-clay-meta">Editorial Series</p>
            <h1>{series.title}</h1>
            <p className="mind-clay-descriptor">{series.descriptor}</p>
            <p className="mind-clay-complete">{series.partCount} parts. A complete work.</p>
          </header>

          <div className="mt-16 border-t border-white/10">
            {series.parts.map((part) => (
              <Link
                key={part.slug}
                href={`/editorials/series/${series.slug}/${part.slug}`}
                className="mind-clay-part-band group"
              >
                <div className="min-w-0">
                  <p className="mind-clay-part-number">
                    Part {formatEditorialSeriesPartNumber(part.order)}
                  </p>
                  <h2>{part.title}</h2>
                  <p className="mind-clay-part-excerpt">{part.excerpt}</p>
                </div>
                <p className="mind-clay-read-time">{part.readTime}</p>
              </Link>
            ))}
          </div>

          <p className="mind-clay-thesis">
            The thesis lands in Part Nine. It was always there.
          </p>
        </section>
      </main>

      <style>{`
        .mind-clay-hub {
          background: #1c1c1e;
          color: #f0ede8;
        }

        .mind-clay-meta,
        .mind-clay-complete,
        .mind-clay-part-number,
        .mind-clay-read-time {
          font-family: "JetBrains Mono", ui-monospace, monospace;
          text-transform: uppercase;
          letter-spacing: 0.28em;
        }

        .mind-clay-meta {
          color: rgba(201, 150, 58, 0.92);
          font-size: 8px;
        }

        h1 {
          margin-top: 1.75rem;
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: clamp(2.7rem, 6vw, 5.35rem);
          font-weight: 300;
          line-height: 0.98;
          letter-spacing: 0;
        }

        .mind-clay-descriptor {
          margin-top: 1.75rem;
          max-width: 44rem;
          color: rgba(240, 237, 232, 0.74);
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(1.1rem, 1.9vw, 1.35rem);
          line-height: 1.8;
        }

        .mind-clay-complete {
          margin-top: 1.5rem;
          color: rgba(240, 237, 232, 0.42);
          font-size: 8px;
        }

        .mind-clay-part-band {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 2rem;
          align-items: start;
          border-bottom: 1px solid rgba(240, 237, 232, 0.1);
          padding: 2rem 0 2.25rem;
        }

        .mind-clay-part-number,
        .mind-clay-read-time {
          color: rgba(240, 237, 232, 0.38);
          font-size: 7.5px;
        }

        h2 {
          margin-top: 0.95rem;
          width: fit-content;
          border-bottom: 1px solid transparent;
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: clamp(1.8rem, 3vw, 2.45rem);
          font-weight: 300;
          line-height: 1.05;
          letter-spacing: 0;
          transition: border-color 150ms ease, color 150ms ease;
        }

        .mind-clay-part-band:hover h2,
        .mind-clay-part-band:focus-visible h2 {
          border-bottom-color: rgba(201, 150, 58, 0.85);
          color: #fff7ea;
        }

        .mind-clay-part-band:visited .mind-clay-part-number {
          color: rgba(240, 237, 232, 0.28);
        }

        .mind-clay-part-excerpt {
          margin-top: 0.95rem;
          max-width: 42rem;
          color: rgba(240, 237, 232, 0.58);
          font-family: Georgia, "Times New Roman", serif;
          font-size: 1.05rem;
          font-style: italic;
          line-height: 1.75;
        }

        .mind-clay-thesis {
          margin: 3.25rem auto 0;
          color: rgba(240, 237, 232, 0.5);
          font-family: Georgia, "Times New Roman", serif;
          font-size: 1rem;
          font-style: italic;
          line-height: 1.7;
          text-align: center;
        }

        @media (max-width: 640px) {
          .mind-clay-part-band {
            grid-template-columns: 1fr;
            gap: 1rem;
            padding: 1.75rem 0 2rem;
          }

          .mind-clay-read-time {
            text-align: left;
          }
        }
      `}</style>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getEditorialSeriesCatalogue().map((series) => ({
    params: { seriesSlug: series.slug },
  })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const seriesSlug = String(params?.seriesSlug || "");
  const series = getEditorialSeriesBySlug(seriesSlug);

  if (!series) {
    return { notFound: true };
  }

  return {
    props: { series },
    revalidate: 1800,
  };
};

export default EditorialSeriesHub;
