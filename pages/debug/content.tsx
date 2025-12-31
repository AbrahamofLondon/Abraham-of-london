/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Layout from "@/components/Layout";
import {
  getAllContentlayerDocs,
  getPublishedDocuments,
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
          <h1 className="font-serif text-3xl font-semibold text-cream">Not Found</h1>
        </main>
      </Layout>
    );
  }

  return (
    <Layout title="Debug · Contentlayer">
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            System Diagnostics
          </p>
          <h1 className="font-serif text-4xl font-semibold text-cream">
            Contentlayer Registry
          </h1>
          
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 shadow-xl">
              <div className="text-xs uppercase tracking-widest text-gray-500">Total documents</div>
              <div className="mt-1 text-3xl font-semibold text-cream">{totals.total}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 shadow-xl">
              <div className="text-xs uppercase tracking-widest text-gray-500">Published</div>
              <div className="mt-1 text-3xl font-semibold text-gold">{totals.published}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 shadow-xl">
              <div className="text-xs uppercase tracking-widest text-gray-500">Drafts</div>
              <div className="mt-1 text-3xl font-semibold text-gray-400">{totals.drafts}</div>
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
              <div className="text-sm font-bold text-red-400 uppercase tracking-widest">Critical Warnings</div>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-300">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="grid grid-cols-12 border-b border-white/10 bg-white/5 px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gold/80">
            <div className="col-span-2">Collection</div>
            <div className="col-span-2 text-center">Published</div>
            <div className="col-span-2 text-center">Drafts</div>
            <div className="col-span-2 text-center">Total</div>
            <div className="col-span-4 pl-4">Path Registry Sample</div>
          </div>

          {rows.map((r) => (
            <div
              key={r.kind}
              className="grid grid-cols-12 items-center gap-2 border-b border-white/5 px-6 py-6 text-sm hover:bg-white/[0.02] transition-colors"
            >
              <div className="col-span-2 font-serif text-lg text-cream capitalize">{r.kind}s</div>
              <div className="col-span-2 text-center font-mono text-gold">{r.published}</div>
              <div className="col-span-2 text-center font-mono text-gray-500">{r.drafts}</div>
              <div className="col-span-2 text-center font-mono text-gray-300">{r.total}</div>

              <div className="col-span-4 space-y-3 pl-4">
                {r.sample.length === 0 ? (
                  <div className="text-[10px] uppercase tracking-widest text-gray-600 italic">Empty Collection</div>
                ) : (
                  r.sample.map((s, i) => (
                    <div key={i} className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-[11px]">
                      <div className="font-semibold text-cream truncate">{s.title || "Untitled"}</div>
                      <div className="mt-1 flex flex-col gap-0.5 font-mono text-gray-500">
                        <span className="text-gold/40">slug: {s.slug}</span>
                        <span className="truncate">href: {s.href}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-center gap-4 rounded-2xl border border-gold/20 bg-gold/5 p-6">
            <div className="h-2 w-2 rounded-full bg-gold animate-pulse" />
            <p className="text-xs leading-relaxed text-gray-300 italic">
                <b>Internal Systems Note:</b> If the Kingdom Vault displays 0 items, check the <b>Total</b> column above. 
                If <b>Total</b> is 0, verify the content folder names match the schema. If <b>Published</b> is 0 but <b>Total</b> is high, 
                verify your frontmatter <code>draft</code> and <code>date</code> keys are valid.
            </p>
        </div>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const nodeEnv = process.env.NODE_ENV ?? "development";

  const all = getAllContentlayerDocs();
  const publishedCount = getPublishedDocuments().length;
  const draftDocs = all.filter((d: any) => isDraft(d));

  const warnings: string[] = [];

  // 1. Sanity Check: Content Engine
  if (!Array.isArray(all) || all.length === 0) {
    warnings.push("FATAL: getAllContentlayerDocs() returned 0 documents. Contentlayer build step likely failed.");
  }

  // 2. Collision Detection: Slug Safety
  const slugMap = new Map<string, string[]>();
  for (const d of all) {
    const slug = normalizeSlug(d);
    const kind = getDocKind(d);
    const arr = slugMap.get(slug) ?? [];
    arr.push(kind);
    slugMap.set(slug, arr);
  }
  const dupes = [...slugMap.entries()].filter(([, kinds]) => new Set(kinds).size > 1);
  if (dupes.length > 0) {
    warnings.push(
      `COLLISION: Duplicate slugs found across collections. Fix immediately to avoid 404s. Example: "${dupes[0][0]}" exists in both [${[...new Set(dupes[0][1])].join(", ")}].`
    );
  }

  // 3. Bucket Construction: Manually sorting kinds
  const rows: Row[] = ALL_KINDS.map((kind) => {
    const allOfKind = all.filter((d: any) => getDocKind(d) === kind);
    const publishedOfKind = allOfKind.filter((d: any) => !isDraft(d));
    const draftsOfKind = allOfKind.filter((d: any) => isDraft(d));

    const sample = publishedOfKind.slice(0, 3).map((d: any) => ({
      title: String(d?.title ?? "Untitled"),
      slug: normalizeSlug(d),
      href: getDocHref(d),
    }));

    return {
      kind,
      published: publishedOfKind.length,
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
        published: publishedCount,
        drafts: draftDocs.length,
      },
      rows,
      warnings,
    },
    revalidate: 10, // Faster refresh for debugging
  };
};

export default DebugContentPage;
