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

  const items: Item[] = docs
    .filter((d) => !isDraft(d))
    .map((d) => ({
      key: String(d?._id ?? `${getDocKind(d)}:${normalizeSlug(d)}`),
      kind: String(getDocKind(d)),
      title: String(d?.title ?? "Untitled"),
      href: getDocHref(d),
      excerpt: d?.excerpt ?? d?.description ?? null,
      date: d?.date ? String(d.date) : null,
      image: resolveDocCoverImage(d),
    }))
    .filter((x) => x.href && x.title)
    .sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0));

  return { props: { items }, revalidate: 1800 };
};

const ContentIndexPage: NextPage<Props> = ({ items }) => {
  const [q, setQ] = React.useState("");

  // 1. Filter items based on search
  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(it => 
      it.title.toLowerCase().includes(s) || 
      it.kind.toLowerCase().includes(s)
    );
  }, [q, items]);

  // 2. Organize items into distinct types/groups
  const groups = React.useMemo(() => {
    const map: Record<string, Item[]> = {};
    filtered.forEach(it => {
      if (!map[it.kind]) map[it.kind] = [];
      map[it.kind].push(it);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <Layout title="The Kingdom Vault" description="Everything. Organised.">
      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-12 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">The Kingdom Vault</p>
            <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">Everything. Organised.</h1>
          </div>
          
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search collections..."
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-cream outline-none focus:border-gold/60"
          />
        </header>

        {groups.length === 0 ? (
          <p className="text-gray-500">No items found.</p>
        ) : (
          <div className="space-y-16">
            {groups.map(([kind, kindItems]) => (
              <section key={kind} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2 className="font-serif text-xl font-medium text-gold/90 capitalize">{kind}s</h2>
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">{kindItems.length} items</span>
                </div>
                
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {kindItems.map((it) => (
                    <li key={it.key} className="group rounded-2xl border border-white/5 bg-black/35 p-4 hover:border-gold/60 hover:bg-black/55 transition">
                      <Link href={it.href} className="block space-y-2">
                        <h3 className="font-serif text-lg font-semibold text-cream group-hover:text-gold transition-colors">{it.title}</h3>
                        {it.excerpt && <p className="text-xs text-gray-400 line-clamp-2">{it.excerpt}</p>}
                        <p className="text-[10px] text-gray-600 font-mono">{it.href}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
};

export default ContentIndexPage;