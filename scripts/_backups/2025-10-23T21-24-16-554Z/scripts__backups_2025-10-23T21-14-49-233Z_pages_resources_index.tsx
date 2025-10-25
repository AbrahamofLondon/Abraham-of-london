import * as React from "react";
import Head from "next/head";
import Link from "next/link";
// <-- FIXED

export default function ResourcesIndex() {
  const resources = [...allResources]
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
    .reverse();

  return (
    <>
      <Head d>
        <title>Resources</title>
      </Head>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-serif mb-6">Resources</h1>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {resources.map((r) => (
            <li key={r._id} className="rounded-xl border p-4">
              <h2 className="text-lg font-semibold">
                <Link href={`/resource/${r.slug}`}>{r.title}</Link>
              </h2>
              {r.excerpt ? (
                <p className="mt-1 text-sm text-gray-600">{r.excerpt}</p>
              ) : null}
              <div className="mt-2 flex gap-2 text-xs text-gray-500">
                {r.category && <span>{r.category}</span>}
                {r.date && (
                  <span>€¢{new Date(r.date).toLocaleDateString()}</span>
                )}
              </div>
              <div className="mt-3">
                <Link
                  href={`/print/resource/${r.slug}`}
                  className="text-sm underline"
                >
                  Print version †'
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
