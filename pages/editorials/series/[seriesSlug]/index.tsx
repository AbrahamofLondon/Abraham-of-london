import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { SeriesBand } from "@/components/editorial/SeriesBand";
import { PublicationCard } from "@/components/editorial/PublicationCard";
import {
  getPublicPublications,
  getPublicationCatalogue,
} from "@/lib/editorial/catalogue";
import { getEditorialSeriesCatalogue } from "@/lib/editorial/series";
import type { PublicationRecord } from "@/lib/editorial/types";
import type { EditorialSeries } from "@/lib/editorial/series";

type EditorialsPageProps = {
  flagship: PublicationRecord | null;
  publications: PublicationRecord[];
  series: EditorialSeries[];
};

const EditorialsPage: NextPage<EditorialsPageProps> = ({
  flagship,
  publications,
  series,
}) => {
  return (
    <>
      <Head>
        <title>Editorials — Abraham of London</title>
        <meta
          name="description"
          content="Flagship publications, editorial series, and formal intellectual work from Abraham of London."
        />
      </Head>

      <div className="min-h-screen bg-[#FAF9F7] dark:bg-[#1C1C1E]">
        <main className="max-w-3xl mx-auto px-6 py-20 md:py-28">

          {/* Page header */}
          <header className="mb-20">
            <p className="text-[10px] tracking-[0.16em] uppercase text-[#C9963A] font-medium mb-5">
              Abraham of London
            </p>
            <h1 className="font-serif text-5xl md:text-6xl text-[#1A1A1A] dark:text-[#F0EDE8] leading-tight mb-6">
              Editorials
            </h1>
            <p className="text-base text-[#5A5A5A] dark:text-[#8A8A8A] leading-relaxed max-w-lg">
              Flagship publications, editorial series, and formal intellectual
              work. Each piece is written to last.
            </p>
          </header>

          {/* Flagship publication — leads the page */}
          {flagship && (
            <section className="mb-20 pb-20 border-b border-[#E8E4DF] dark:border-[#2A2A2A]">
              <PublicationCard publication={flagship} featured />
            </section>
          )}

          {/* Editorial Series band */}
          {series.length > 0 && (
            <section className="mb-20 pb-20 border-b border-[#E8E4DF] dark:border-[#2A2A2A]">
              <SeriesBand series={series} />
            </section>
          )}

          {/* Publication catalogue — remaining records */}
          {publications.length > 0 && (
            <section>
              <div className="mb-8">
                <span className="text-xs tracking-[0.12em] uppercase text-[#8A8A8A] font-medium">
                  Publications
                </span>
              </div>
              <div>
                {publications.map((pub) => (
                  <PublicationCard key={pub.slug} publication={pub} />
                ))}
              </div>
            </section>
          )}

          {/* Empty state — catalogue not yet populated beyond flagship */}
          {publications.length === 0 && !flagship && series.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-sm text-[#8A8A8A]">
                Publications forthcoming.
              </p>
            </div>
          )}

        </main>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps<EditorialsPageProps> = async () => {
  const allPublications = getPublicPublications();
  const series = getEditorialSeriesCatalogue().filter(
    (s) => s.status === "PUBLISHED",
  );

  // The flagship is the first publication — currently "ultimate-purpose-of-man"
  // It leads the page as a featured card; the rest populate the catalogue band.
  const flagship = allPublications[0] ?? null;
  const publications = flagship ? allPublications.slice(1) : allPublications;

  return {
    props: {
      flagship,
      publications,
      series,
    },
  };
};

export default EditorialsPage;