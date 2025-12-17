import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Layout from "@/components/Layout";
import {
  getPublishedDocuments,
  getDocHref,
  getDocKind,
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

export const getStaticProps: GetStaticProps<Props> = async () => {
  // Use the unified published documents fetcher
  const docs = getPublishedDocuments();

  const items: Item[] = docs
    .map((d) => ({
      key: d._id ?? `${getDocKind(d)}:${normalizeSlug(d)}`,
      kind: getDocKind(d),
      title: d.title ?? "Untitled",
      href: getDocHref(d),
      excerpt: d.excerpt ?? d.description ?? null,
      date: d.date ? String(d.date) : null,
      image: resolveDocCoverImage(d),
    }))
    .filter((x) => x.href && x.title)
    // Sort globally by date (newest first)
    .sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0));

  return { props: { items }, revalidate: 1800 };
};

const ContentIndexPage: NextPage<Props> = ({ items }) => {
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(it => 
      it.title.toLowerCase().includes(s) || 
      it.kind.toLowerCase().includes(s) ||
      (it.excerpt ?? "").toLowerCase().includes(s)
    );
  }, [q, items]);

  const groups = React.useMemo(() => {
    const map: Record<string, Item[]> = {};
    filtered.forEach(it => {
      const groupName = it.kind;
      if (!map[groupName]) map[groupName] = [];
      map[groupName].push(it);
    });
    // Sort groups alphabetically (Books, Canons, Downloads, etc.)
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <Layout title="The Kingdom Vault" description="Strategic Resources. Organised.">
      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-12 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">The Kingdom Vault</p>
            <h1 className="mt-2 font-serif text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">Everything. Organised.</h1>
            <p className="mt-4 text-gray-400 max-w-2xl">
              A centralized repository of strategic frameworks, theological volumes, and 
              practical resources for the intentional builder.
            </p>
          </div>
          
          <div className="relative group">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search across all collections..."
              className="w-full rounded-xl border border-white/10 bg-black/30 px-5 py-4 text-cream outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/20 transition-all"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-mono tracking-tighter opacity-0 group-focus-within:opacity-100 transition-opacity">
              ESC TO CLEAR
            </div>
          </div>
        </header>

        {groups.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl">
            <p className="text-gray-500">No matching frameworks or resources found.</p>
          </div>
        ) : (
          <div className="space-y-20">
            {groups.map(([kind, kindItems]) => (
              <section key={kind} className="space-y-8">
                <div className="flex items-center gap-4">
                  <h2 className="font-serif text-2xl font-medium text-gold/90 capitalize">
                    {kind === 'post' ? 'Essays' : `${kind}s`}
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium">{kindItems.length} items</span>
                </div>
                
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {kindItems.map((it) => (
                    <li key={it.key} className="group relative rounded-2xl border border-white/5 bg-black/40 p-5 hover:border-gold/50 hover:bg-black/60 transition-all duration-300">
                      <Link href={it.href} className="block space-y-3">
                        <div className="flex justify-between items-start">
                           <h3 className="font-serif text-lg font-semibold text-cream group-hover:text-gold transition-colors leading-tight">
                            {it.title}
                          </h3>
                        </div>
                        {it.excerpt && (
                          <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                            {it.excerpt}
                          </p>
                        )}
                        <div className="pt-2 flex items-center justify-between">
                           <p className="text-[9px] text-gray-600 font-mono uppercase tracking-tighter group-hover:text-gold/50 transition-colors">
                            {it.href}
                          </p>
                          <span className="text-gold opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                        </div>
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