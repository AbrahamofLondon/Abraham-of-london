import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Box, Terminal } from "lucide-react";
import Layout from "@/components/Layout";
import { getPublishedDocuments } from '@/lib/contentlayer';

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
  // Fetches using the immutable Core Engine logic
  const docs = getPublishedDocuments();

  const items: Item[] = docs
    .map((d) => ({
      // Ensure key is always a string
      key: String(d._id ?? `${getDocKind(d)}:${normalizeSlug(d)}`),
      kind: getDocKind(d),
      title: String(d.title ?? "Untitled Framework"),
      href: getDocHref(d),
      excerpt: d.excerpt ?? d.description ?? null,
      date: d.date ? String(d.date) : null,
      image: resolveDocCoverImage(d),
    }))
    .filter((x) => x.href && x.title)
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
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <Layout title="The Kingdom Vault" description="Centralized Strategic Repository.">
      <main className="min-h-screen bg-[#050505] text-cream">
        
        {/* Header Section */}
        <section className="relative overflow-hidden border-b border-white/5 pb-16 pt-32 lg:pt-40">
          <div className="absolute inset-0 opacity-[0.02] [background-image:radial-gradient(circle_at_center,_#d4af37_1px,_transparent_1px)] [background-size:32px_32px]" />
          
          <div className="relative z-10 mx-auto max-w-5xl px-6">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1">
              <Terminal size={12} className="text-gold" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">System: Central Vault</span>
            </div>
            
            <h1 className="font-serif text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Everything. <span className="italic text-gold/80">Organised.</span>
            </h1>
            
            <div className="mt-12 relative group max-w-2xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-gold" size={18} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search collections, themes, or keywords..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-5 pl-14 pr-6 text-base text-cream outline-none transition-all focus:border-gold/40 focus:ring-4 focus:ring-gold/5"
              />
              {q && (
                <button 
                  onClick={() => setQ("")}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Unified Collections Grid */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          {groups.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="rounded-3xl border border-dashed border-white/10 py-32 text-center"
            >
              <Box className="mx-auto mb-4 text-gray-700" size={40} />
              <p className="font-serif text-xl italic text-gray-500">No assets matching the current query.</p>
            </motion.div>
          ) : (
            <div className="space-y-24">
              {groups.map(([kind, kindItems]) => (
                <div key={kind} className="space-y-10">
                  <div className="flex items-center gap-6">
                    <h2 className="font-serif text-2xl font-bold uppercase tracking-tight text-gold/90 sm:text-3xl">
                      {kind === 'post' ? 'Essays' : `${kind}s`}
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-gold/20 to-transparent" />
                    <span className="font-mono text-[10px] text-gray-600 uppercase tracking-widest">{kindItems.length} Volumes</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {kindItems.map((it) => (
                      <motion.div
                        key={it.key}
                        whileHover={{ y: -4 }}
                        className="group relative flex flex-col justify-between rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-8 transition-all hover:border-gold/30 hover:shadow-2xl hover:shadow-gold/5"
                      >
                        <Link href={it.href} className="flex h-full flex-col">
                          <h3 className="mb-4 font-serif text-2xl font-semibold leading-tight text-cream group-hover:text-gold transition-colors">
                            {it.title}
                          </h3>
                          
                          {it.excerpt && (
                            <p className="mb-8 text-sm leading-relaxed text-gray-400 line-clamp-2">
                              {it.excerpt}
                            </p>
                          )}
                          
                          <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                            <span className="font-mono text-[9px] uppercase tracking-widest text-gray-600 group-hover:text-gold/50 transition-colors">
                              {it.href.replace(/^\//, '').replace(/\//g, ' · ')}
                            </span>
                            <ArrowRight size={16} className="text-gold opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

export default ContentIndexPage;
