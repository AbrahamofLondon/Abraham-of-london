/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Layout from "@/components/Layout";
import {
  getAllContentlayerDocs,
  getPublishedDocuments,
  getPublishedDocumentsByType,
  getDocKind,
  getDocHref,
  isDraft,
  normalizeSlug,
  type DocKind,
} from "@/lib/contentlayer-helper";

type Row = {
  kind: DocKind;
  published: number;
  drafts: number;
  total: number;
  sample: Array<{ title: string; slug: string; href: string }>;
};

type Props = {
  nodeEnv: string;
  totals: { total: number; published: number; drafts: number };
  rows: Row[];
  warnings: string[];
};

const ALL_KINDS: DocKind[] = [
  "post",
  "canon",
  "resource",
  "download",
  "print",
  "book",
  "event",
  "short",
  "strategy",
];

const DebugContentPage: NextPage<Props> = ({ nodeEnv, totals, rows, warnings }) => {
  // Hard gate in prod to avoid exposing internals
  if (nodeEnv === "production") {
    return (
      <Layout title="Not Found">
        <main className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="font-serif text-3xl font-semibold">Not Found</h1>
        </main>
      </Layout>
    );
  }

  return (
    <Layout title="Debug · Contentlayer">
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
            Debug
          </p>
          <h1 className="font-serif text-4xl font-semibold text-neutral-900">
            Contentlayer Diagnostics
          </h1>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="text-sm text-neutral-600">Total docs</div>
              <div className="text-2xl font-semibold text-neutral-900">{totals.total}</div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="text-sm text-neutral-600">Published</div>
              <div className="text-2xl font-semibold text-neutral-900">{totals.published}</div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="text-sm text-neutral-600">Drafts</div>
              <div className="text-2xl font-semibold text-neutral-900">{totals.drafts}</div>
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm font-semibold text-amber-900">Warnings</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900/90">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="grid grid-cols-12 border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            <div className="col-span-2">Kind</div>
            <div className="col-span-2">Published</div>
            <div className="col-span-2">Drafts</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-4">Sample</div>
          </div>

          {rows.map((r) => (
            <div
              key={r.kind}
              className="grid grid-cols-12 gap-2 border-b border-neutral-100 px-4 py-4 text-sm"
            >
              <div className="col-span-2 font-semibold text-neutral-900">{r.kind}</div>
              <div className="col-span-2 text-neutral-700">{r.published}</div>
              <div className="col-span-2 text-neutral-700">{r.drafts}</div>
              <div className="col-span-2 text-neutral-700">{r.total}</div>

              <div className="col-span-4 space-y-2">
                {r.sample.length === 0 ? (
                  <div className="text-neutral-400">—</div>
                ) : (
                  r.sample.map((s, i) => (
                    <div key={i} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="font-medium text-neutral-900 line-clamp-1">
                        {s.title || "Untitled"}
                      </div>
                      <div className="mt-1 text-xs text-neutral-600">
                        <span className="font-semibold">slug:</span> {s.slug}
                      </div>
                      <div className="mt-1 text-xs text-neutral-600">
                        <span className="font-semibold">href:</span> {s.href}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-neutral-200 bg-white p-4 text-xs text-neutral-600">
          Tip: if Vault shows <b>0</b>, this page tells you exactly which bucket is empty and why.
        </div>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const nodeEnv = process.env.NODE_ENV ?? "development";

  const all = getAllContentlayerDocs();
  const published = getPublishedDocuments();
  const drafts = all.filter((d: any) => isDraft(d));

  const buckets = getPublishedDocumentsByType();

  const warnings: string[] = [];

  // sanity checks
  if (!Array.isArray(all) || all.length === 0) {
    warnings.push("getAllContentlayerDocs() returned 0 documents. Contentlayer may not be generating.");
  }

  // detect duplicate slugs across doc types (common cause of collisions)
  const slugMap = new Map<string, string[]>();
  for (const d of all) {
    const slug = normalizeSlug(d);
    const kind = getDocKind(d);
    const key = `${slug}`;
    const arr = slugMap.get(key) ?? [];
    arr.push(kind);
    slugMap.set(key, arr);
  }
  const dupes = [...slugMap.entries()].filter(([, kinds]) => new Set(kinds).size > 1);
  if (dupes.length > 0) {
    warnings.push(
      `Duplicate slugs across kinds detected (${dupes.length}). Example: "${dupes[0][0]}" in [${[
        ...new Set(dupes[0][1]),
      ].join(", ")}].`
    );
  }

  const rows: Row[] = ALL_KINDS.map((kind) => {
    const pubDocs = buckets[kind] ?? [];

    const allOfKind = all.filter((d: any) => getDocKind(d) === kind);
    const draftsOfKind = allOfKind.filter((d: any) => isDraft(d));

    const sample = pubDocs.slice(0, 3).map((d: any) => ({
      title: String(d?.title ?? ""),
      slug: normalizeSlug(d),
      href: getDocHref(d),
    }));

    return {
      kind,
      published: pubDocs.length,
      drafts: draftsOfKind.length,
      total: allOfKind.length,
      sample,
    };
  });

  return {
    props: {
      nodeEnv,
      totals: {
        total: all.length,
        published: published.length,
        drafts: drafts.length,
      },
      rows,
      warnings,
    },
    revalidate: 30,
  };
};

export default DebugContentPage;