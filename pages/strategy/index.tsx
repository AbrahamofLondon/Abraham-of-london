// pages/strategy/index.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps } from "next";

// CORRECTED Contentlayer import path
import * as CL from "contentlayer/generated";

// Assuming useDebounce exists in your project utilities
import { useDebounce } from "@/lib/hooks/useDebounce"; 

// --- Contentlayer Collection Access ---
// A type-safe way to access the collection, handling possible pluralization/singularization
const allStrategies = (CL as any).allStrategies || (CL as any).allStrategys || [];

// --- Type Definitions ---
type Row = {
  slug: string;
  title: string;
  description?: string | null;
  date?: string | null;
  author?: string | null;
  tags?: string[] | null;
  coverImage?: string | null;
};
type Props = { items: Row[] };

// --- Component ---
export default function StrategyIndex({ items }: Props) {
  const [query, setQuery] = React.useState("");
  // Apply useDebounce to the search input state
  const debouncedQuery = useDebounce(query, 300);

  const filtered = React.useMemo(
    () => {
      const q = debouncedQuery.toLowerCase().trim();
      if (!q) return items;
      
      return items.filter((s) => {
        // Concatenate and normalize all searchable fields
        const hay = `${s.title} ${s.description ?? ""} ${s.author ?? ""}`.toLowerCase();
        return hay.includes(q);
      });
    },
    [items, debouncedQuery] // Dependency on debouncedQuery
  );

  return (
    <>
      <Head>
        <title>Strategy — Abraham of London</title>
        <meta name="description" content="Principled strategy notes, briefs, and playbooks." />
      </Head>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-deepCharcoal">Strategy</h1>
            <p className="text-sm text-[color:var(--color-on-secondary)/0.75]">
              {filtered.length} of {items.length} shown
            </p>
          </div>
          <input
            value={query} // Bind input value to immediate 'query' state
            onChange={(e) => setQuery(e.target.value)} // Update 'query' immediately
            placeholder="Search strategy…"
            className="w-full rounded-full border border-lightGrey bg-white px-4 py-2 text-sm sm:w-80"
            aria-label="Search strategy"
          />
        </header>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <li key={s.slug} className="rounded-2xl border border-lightGrey bg-white p-5 shadow-card hover:shadow-cardHover">
              {s.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.coverImage}
                  alt=""
                  className="mb-3 aspect-[16/9] w-full rounded-xl object-cover"
                  loading="lazy"
                />
              )}
              <h2 className="font-serif text-xl font-semibold text-deepCharcoal">
                <Link href={`/strategy/${s.slug}`} className="hover:underline decoration-softGold/60 underline-offset-4">
                  {s.title}
                </Link>
              </h2>
              <p className="mt-1 text-sm text-[color:var(--color-on-secondary)/0.75]">
                {s.author ?? ""}{s.author && s.date ? " • " : ""}{s.date ?? ""}
              </p>
              {Array.isArray(s.tags) && s.tags.length > 0 && (
                <p className="mt-2 text-xs text-[color:var(--color-on-secondary)/0.65]">{s.tags.join(" • ")}</p>
              )}
              {s.description && <p className="mt-3 text-sm text-[color:var(--color-on-secondary)/0.85]">{s.description}</p>}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

// --- Data Fetching ---
export const getStaticProps: GetStaticProps<Props> = async () => {
  const items: Row[] = allStrategies
    .map((s: any) => ({
      slug: s.slug,
      title: s.title,
      description: s.description ?? null,
      date: s.date ?? null,
      author: s.author ?? null,
      tags: Array.isArray(s.tags) ? s.tags : null,
      coverImage: s.coverImage ?? null,
    }))
    // Sort by date descending (latest first)
    .sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")));

  return { props: { items } };
};