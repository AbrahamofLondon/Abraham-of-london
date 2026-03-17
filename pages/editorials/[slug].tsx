// pages/editorials/[slug].tsx
import Head from "next/head";
import type { GetStaticPaths, GetStaticProps } from "next";
import { getPublicationBySlug, getPublicationCatalogue } from "@/lib/editorial/catalogue";
import type { PublicationRecord } from "@/lib/editorial/types";

type Props = {
  item: PublicationRecord;
};

export default function EditorialPage({ item }: Props) {
  return (
    <>
      <Head>
        <title>{item.title} | Abraham of London</title>
        <meta name="description" content={item.description || item.subtitle || item.title} />
      </Head>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-600">
          {item.category || "Editorial"} · {item.tier}
        </p>

        <h1 className="mt-4 text-5xl font-serif">{item.title}</h1>

        {item.subtitle ? <p className="mt-4 max-w-3xl text-lg text-zinc-600">{item.subtitle}</p> : null}
        {item.description ? <p className="mt-6 max-w-3xl leading-7 text-zinc-700">{item.description}</p> : null}

        <div className="mt-8 flex flex-wrap gap-3">
          {item.pdfPath ? (
            <a
              href={item.pdfPath}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-zinc-900 px-5 py-3 text-sm text-white"
            >
              Download PDF
            </a>
          ) : null}

          {item.previewEnabled ? (
            <a
              href={`/api/editorials/preview/${item.slug}`}
              className="rounded-full border border-zinc-300 px-5 py-3 text-sm"
            >
              Preview
            </a>
          ) : null}

          {item.epubEnabled && item.epubPath ? (
            <a
              href={item.epubPath}
              className="rounded-full border border-zinc-300 px-5 py-3 text-sm"
            >
              EPUB
            </a>
          ) : null}
        </div>

        <section className="mt-14 grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-zinc-200 p-6">
            <h2 className="text-xl font-serif">Publication Record</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div><dt className="font-semibold">Author</dt><dd>{item.author}</dd></div>
              <div><dt className="font-semibold">Date</dt><dd>{item.date || "—"}</dd></div>
              <div><dt className="font-semibold">Version</dt><dd>{item.version || "—"}</dd></div>
              <div><dt className="font-semibold">Status</dt><dd>{item.status || "—"}</dd></div>
              <div><dt className="font-semibold">Reading Time</dt><dd>{item.readingTime || "—"}</dd></div>
            </dl>
          </div>

          <div className="rounded-3xl border border-zinc-200 p-6">
            <h2 className="text-xl font-serif">Citation</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-700">
              {item.citation.citationAuthor}. <em>{item.citation.citationTitle}</em>. Abraham of London, {item.citation.citationYear}.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const items = getPublicationCatalogue();
  return {
    paths: items.map((item) => ({ params: { slug: item.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const slug = typeof ctx.params?.slug === "string" ? ctx.params.slug : "";
  const item = getPublicationBySlug(slug);

  if (!item) {
    return { notFound: true };
  }

  return {
    props: { item },
  };
};