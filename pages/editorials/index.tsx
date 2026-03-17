// pages/editorials/index.tsx
import Link from "next/link";
import type { GetStaticProps } from "next";
import { getPublicationCatalogue } from "@/lib/editorial/catalogue";
import type { PublicationRecord } from "@/lib/editorial/types";

type Props = {
  items: PublicationRecord[];
};

export default function EditorialLibrary({ items }: Props) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-12">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-600">Editorial Canon</p>
        <h1 className="mt-3 text-4xl font-serif">Books, Editorials & Working Papers</h1>
        <p className="mt-4 max-w-3xl text-zinc-600">
          Canonical essays, flagship editorials, strategic papers, and institutional publications from Abraham of London.
        </p>
      </header>

      <section className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.slug} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              {item.category || "Editorial"} · {item.tier}
            </p>
            <h2 className="mt-3 text-2xl font-serif">{item.title}</h2>
            {item.subtitle ? <p className="mt-2 text-sm text-zinc-600">{item.subtitle}</p> : null}
            {item.description ? <p className="mt-4 text-sm leading-6 text-zinc-700">{item.description}</p> : null}

            <div className="mt-5 flex items-center justify-between text-xs text-zinc-500">
              <span>{item.readingTime || "—"}</span>
              <span>{item.date || "—"}</span>
            </div>

            <div className="mt-6 flex gap-3">
              <Link
                href={`/editorials/${item.slug}`}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm"
              >
                View
              </Link>

              {item.pdfPath ? (
                <a
                  href={item.pdfPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white"
                >
                  PDF
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  return {
    props: {
      items: getPublicationCatalogue(),
    },
  };
};