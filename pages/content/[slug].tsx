// pages/content/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";
import * as generated from "contentlayer/generated";

import {
  getDocHref,
  getDocKind,
  isDraft,
  normalizeSlug,
  resolveDocCoverImage,
} from "@/lib/contentlayer-helper";

type Item = {
  key: string;
  kind: string;
  title: string;
  href: string;
  excerpt?: string | null;
  date?: string | null;
  image?: string | null;
};

type Props = { items: Item[] };

function pickArray(name: string): any[] {
  const v = (generated as any)[name];
  return Array.isArray(v) ? v : [];
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const docs: any[] = [
    ...pickArray("allPosts"),
    ...pickArray("allBooks"),
    ...pickArray("allDownloads"),
    ...pickArray("allEvents"),
    ...pickArray("allPrints"),
    ...pickArray("allResources"),
    ...pickArray("allStrategies"),
    ...pickArray("allCanons"),
    ...pickArray("allShorts"),
  ].filter(Boolean);

  const published = docs.filter((d) => !isDraft(d));

  const items: Item[] = published
    .map((d) => {
      const kind = String(getDocKind(d));
      const slug = normalizeSlug(d);
      const href = getDocHref(d);

      return {
        key: String(d?._id ?? `${kind}:${slug}`),
        kind,
        title: String(d?.title ?? "Untitled"),
        href,
        excerpt: d?.excerpt ?? d?.description ?? null,
        date: d?.date ? String(d.date) : null,
        image: resolveDocCoverImage(d),
      };
    })
    .filter((x) => x.href && x.title)
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

  return { props: { items }, revalidate: 1800 };
};

const ContentIndexPage: NextPage<Props> = ({ items }) => {
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((it) => {
      return (
        it.title.toLowerCase().includes(s) ||
        (it.excerpt ?? "").toLowerCase().includes(s) ||
        it.kind.toLowerCase().includes(s)
      );
    });
  }, [q, items]);

  return (
    <Layout title="The Kingdom Vault" description="Everything. Organised.">
      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-8 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            The Kingdom Vault
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            Everything. Organised.
          </h1>
          <p className="text-sm text-gray-300">
            Essays, Canon volumes, resources, downloads, prints, books, events,
            shorts, strategy — each with its place, each with its purpose.
          </p>

          <div className="mt-6">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search everything…"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-cream placeholder:text-gray-500 outline-none focus:border-gold/60"
            />
          </div>
        </header>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400">
            No results found
            <span className="block text-xs text-gray-500 mt-1">
              Try adjusting your search terms or browse all collections.
            </span>
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((it) => (
              <li
                key={it.key}
                className="rounded-2xl border border-white/5 bg-black/35 p-4 hover:border-gold/60 hover:bg-black/55 transition"
              >
                <Link href={it.href} className="block space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold/70">
                    {it.kind}
                  </p>
                  <h3 className="font-serif text-lg font-semibold text-cream">
                    {it.title}
                  </h3>
                  {it.excerpt ? (
                    <p className="text-xs text-gray-300 line-clamp-3">
                      {it.excerpt}
                    </p>
                  ) : null}
                  <p className="text-[11px] text-gray-500">{it.href}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </Layout>
  );
};

export default ContentIndexPage;