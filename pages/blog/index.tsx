/* pages/blog/index.tsx — ESSAYS & FIELD NOTES (INTEGRITY MODE) */
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { 
  getContentlayerData, 
  normalizeSlug, 
  getPublishedDocuments,
  sanitizeData 
} from "@/lib/contentlayer-compat";
import { 
  Calendar, 
  Clock, 
  Search, 
  Tag, 
  ArrowRight, 
  Filter, 
  ChevronRight, 
  BookOpen, 
  TrendingUp, 
  Sparkles 
} from "lucide-react";

type Item = {
  slug: string;
  url: string;
  title: string;
  excerpt: string | null;
  date: string | null;
  readTime: string | null;
  coverImage: string | null;
  tags: string[];
  author: string | null;
};

type Props = { 
  items: Item[];
  featuredItems: Item[];
  popularTags: string[];
};

const BlogIndex: NextPage<Props> = ({ items, featuredItems, popularTags }) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
  const [visibleItems, setVisibleItems] = React.useState(items);

  React.useEffect(() => {
    let filtered = items;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(term) || 
        item.excerpt?.toLowerCase().includes(term)
      );
    }
    if (selectedTag) {
      filtered = filtered.filter(item => item.tags.includes(selectedTag));
    }
    setVisibleItems(filtered);
  }, [items, searchTerm, selectedTag]);

  return (
    <Layout title="Essays | Abraham of London">
      <Head>
        <title>Essays | Abraham of London</title>
        <meta name="description" content="Field notes and strategic clarity for builders who refuse drift." />
        <link rel="canonical" href="https://abrahamoflondon.com/blog" />
      </Head>

      <main className="min-h-screen bg-black text-gray-300 selection:bg-gold selection:text-black">
        {/* HERO SECTION */}
        <section className="relative py-20 border-b border-white/5 bg-gradient-to-b from-zinc-900 to-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-gold/70 mb-6">
                <ChevronRight size={14} /> <span>Institutional Archive</span>
              </div>
              <h1 className="font-serif text-5xl md:text-7xl font-bold text-white mb-6">Essays</h1>
              <p className="text-xl text-gray-400 leading-relaxed italic">
                Field notes, convictions, and strategic clarity — written for builders who refuse drift.
              </p>
            </header>
          </div>
        </section>

        {/* SEARCH & FILTER ENGINE */}
        <section className="py-12 border-b border-white/5 bg-zinc-950/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-gold transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Search manuscripts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-gold/50 outline-none transition-all"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                {popularTags.map(tag => (
                  <button 
                    key={tag} 
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedTag === tag ? 'bg-gold text-black' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* GRID ENGINE */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {visibleItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleItems.map((item) => (
                <Link key={item.slug} href={item.url} className="group">
                  <div className="h-full flex flex-col rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-gold/20 transition-all overflow-hidden">
                    <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900">
                      {item.coverImage ? (
                        <Image 
                          src={item.coverImage} 
                          alt={item.title} 
                          fill 
                          className="object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center italic text-white/5 font-serif text-3xl">Essay</div>
                      )}
                    </div>
                    <div className="p-8 flex flex-col flex-grow">
                      <div className="flex items-center gap-4 text-[10px] font-mono text-gray-600 uppercase mb-4">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {item.date}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {item.readTime}</span>
                      </div>
                      <h2 className="font-serif text-2xl text-white mb-4 group-hover:text-gold transition-colors line-clamp-2">{item.title}</h2>
                      <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed mb-8">{item.excerpt}</p>
                      <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                         <div className="flex gap-2">
                           {item.tags.slice(0, 2).map(tag => (
                             <span key={tag} className="text-[9px] font-black uppercase text-gold/50">#{tag}</span>
                           ))}
                         </div>
                         <ArrowRight size={16} className="text-gray-700 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-32 text-center">
              <p className="font-serif text-2xl text-gray-600 italic">No essays found matching your criteria.</p>
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    const data = await getContentlayerData();
    const published = getPublishedDocuments().filter((d: any) => {
      const dir = String(d._raw?.sourceFileDir || "").toLowerCase();
      return dir.includes('blog') || dir.includes('posts');
    });

    const items: Item[] = published.map((p: any) => ({
      slug: normalizeSlug(p.slugComputed || p.slug || p._raw?.flattenedPath || ""),
      url: `/blog/${normalizeSlug(p.slugComputed || p.slug || p._raw?.flattenedPath || "").replace(/^blog\//, '')}`,
      title: p.title ?? "Untitled Manuscript",
      excerpt: p.excerpt ?? p.description ?? null,
      date: p.date ? new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
      readTime: p.readTime ?? "5 min read",
      coverImage: p.coverImage ?? p.image ?? null,
      tags: Array.isArray(p.tags) ? p.tags : [],
      author: p.author ?? "Abraham of London",
    }))
    .filter(x => x.url.startsWith("/blog/") && Boolean(x.title))
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

    const popularTags = Array.from(new Set(items.flatMap(i => i.tags))).slice(0, 10);
    const featuredItems = items.filter(i => i.tags.includes('featured')).slice(0, 2);

    return { 
      props: sanitizeData({ items, featuredItems, popularTags }), 
      revalidate: 3600 
    };
  } catch (error) {
    console.error("[BLOG_INDEX_FAILURE]", error);
    return { props: { items: [], featuredItems: [], popularTags: [] }, revalidate: 3600 };
  }
};

export default BlogIndex;