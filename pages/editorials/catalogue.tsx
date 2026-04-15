import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps, NextPage } from "next";
import type { DiscoveredPublication } from "@/lib/editorial/types";

type Props = {
  publications: DiscoveredPublication[];
};

const EditorialCataloguePage: NextPage<Props> = ({ publications }) => {
  return (
    <>
      <Head>
        <title>Editorial Catalogue | Abraham of London</title>
        <meta
          name="description"
          content="Browse editorials, publications, and strategic writing from Abraham of London."
        />
      </Head>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <header className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-600">
            Publications
          </p>
          <h1 className="mt-4 text-5xl font-serif">Editorial Catalogue</h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600">
            A structured catalogue of editorials and publication records.
          </p>
        </header>

        {publications.length === 0 ? (
          <section className="mt-12 rounded-3xl border border-zinc-200 p-8">
            <p className="text-sm text-zinc-600">No publications available yet.</p>
          </section>
        ) : (
          <section className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {publications.map((pub) => (
              <article
                key={pub.slug}
                className="rounded-3xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-amber-700">
                  <span>{pub.category || "Editorial"}</span>
                  <span>·</span>
                  <span>{pub.tier || "public"}</span>
                </div>

                <h2 className="mt-4 text-2xl font-serif text-zinc-900">
                  <Link
                    href={`/editorials/${encodeURIComponent(pub.slug)}`}
                    className="hover:text-amber-700"
                  >
                    {pub.title}
                  </Link>
                </h2>

                {pub.description ? (
                  <p className="mt-4 text-sm leading-7 text-zinc-600">
                    {pub.description}
                  </p>
                ) : null}

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    {pub.date || "Undated"}
                  </span>

                  <Link
                    href={`/editorials/${encodeURIComponent(pub.slug)}`}
                    className="rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-900 transition-colors hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
                  >
                    View
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </>
  );
};

// Filesystem work must stay on the server. Dynamic import inside
// getStaticProps keeps lib/editorial/discovery.ts (which imports 'fs')
// out of the client bundle entirely.
export const getStaticProps: GetStaticProps<Props> = async () => {
  console.log("[PAGE_DATA] pages/editorials/catalogue.tsx getStaticProps START");
  try {
  try {
  const { discoverPublications } = await import("@/lib/editorial/discovery");
  const publications = discoverPublications();

  return {
    props: {
      publications: JSON.parse(JSON.stringify(publications)) as DiscoveredPublication[],
    },
  };

  } finally {
  }

  } finally {
    console.log("[PAGE_DATA] pages/editorials/catalogue.tsx getStaticProps END");
  }
};

export default EditorialCataloguePage;
