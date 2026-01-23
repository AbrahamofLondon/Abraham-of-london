/* pages/books/index.tsx — VOLUMES & MANUSCRIPTS (INTEGRITY MODE) */
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  Search, 
  Filter, 
  Library, 
  TrendingUp, 
  Award, 
  ChevronRight 
} from "lucide-react";

import Layout from "@/components/Layout";
import SilentSurface from "@/components/ui/SilentSurface";
import { 
  getContentlayerData, 
  normalizeSlug, 
  getPublishedDocuments,
  sanitizeData 
} from "@/lib/contentlayer-compat";

export type BookListItem = {
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  coverImage: string | null;
  readTime: string | null;
  tags: string[];
  featured: boolean;
  author: string | null;
  publishedDate: string | null;
  series?: string | null;
  href: string; // Integrity: strictly defined path
};

interface BooksPageProps {
  books: BookListItem[];
  featuredBooks: BookListItem[];
  popularTags: string[];
  seriesList: string[];
}

const BooksPage: NextPage<BooksPageProps> = ({ 
  books, 
  featuredBooks, 
  popularTags, 
  seriesList 
}) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
  const [visibleBooks, setVisibleBooks] = React.useState(books);

  React.useEffect(() => {
    let filtered = books;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.title.toLowerCase().includes(term) || 
        b.excerpt?.toLowerCase().includes(term)
      );
    }
    if (selectedTag) {
      filtered = filtered.filter(b => b.tags.includes(selectedTag));
    }
    setVisibleBooks(filtered);
  }, [searchTerm, selectedTag, books]);

  return (
    <Layout
      title="Volumes & Manuscripts"
      description="Long-form works and canonical volumes from the Abraham of London canon."
    >
      <main className="bg-charcoal min-h-screen">
        {/* HERO: INSTITUTIONAL REPOSITORY */}
        <div className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b from-black via-[#050608] to-black py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.1),_transparent_60%)]" />
          <div className="container relative mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gold/70 mb-6">
              <Library size={14} /> <span>Canon · Volumes</span>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl text-cream mb-6">Books & Volumes</h1>
            <p className="max-w-2xl mx-auto text-white/60 leading-relaxed italic">
              The manuscripts where the arguments are built properly. No shortcuts.
            </p>
          </div>
        </div>

        {/* SEARCH & FILTER ENGINE */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto mb-16 space-y-8">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search the library..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-gold/50 outline-none transition-all"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {popularTags.map(tag => (
                <button 
                  key={tag} 
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${selectedTag === tag ? 'bg-gold text-black' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* VOLUMES GRID */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {visibleBooks.map((book) => (
              <Link key={book.slug} href={book.href} className="group">
                <SilentSurface className="h-full flex flex-col overflow-hidden border border-white/5 bg-white/[0.02] hover:border-gold/30 transition-all rounded-3xl" hover>
                  <div className="relative aspect-[3/4] bg-zinc-900 overflow-hidden">
                    {book.coverImage ? (
                      <Image src={book.coverImage} alt={book.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center italic text-white/10 font-serif text-3xl">Volume</div>
                    )}
                    {book.featured && (
                      <div className="absolute top-4 left-4 bg-gold text-black px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-2xl">
                        <Sparkles size={10} /> Featured
                      </div>
                    )}
                  </div>
                  
                  <div className="p-8 flex flex-col flex-grow">
                    <h2 className="font-serif text-2xl text-cream mb-2 group-hover:text-gold transition-colors">{book.title}</h2>
                    {book.subtitle && <p className="text-xs text-gold/60 uppercase tracking-widest mb-4 font-bold">{book.subtitle}</p>}
                    <p className="text-sm text-white/50 line-clamp-3 leading-relaxed mb-8">{book.excerpt}</p>
                    
                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-[10px] font-mono text-gray-600 uppercase">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {book.publishedDate ? new Date(book.publishedDate).getFullYear() : 'TBC'}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {book.readTime || 'Long-form'}</span>
                      </div>
                      <ArrowRight size={16} className="text-gray-700 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </SilentSurface>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA: FULL ACCESS */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto rounded-3xl border border-gold/20 bg-gold/5 p-12 text-center backdrop-blur-sm">
            <h3 className="font-serif text-3xl text-white mb-6">Access the Full Architecture</h3>
            <p className="text-white/60 mb-10 max-w-xl mx-auto">Join the Inner Circle for full access to restricted volumes, early manuscripts, and strategic implementation notes.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/inner-circle" className="bg-gold text-black px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gold/80 transition-all">Unlock Library</Link>
              <Link href="/canon" className="border border-white/20 text-white px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-all">Learn More</Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<BooksPageProps> = async () => {
  try {
    // COMMAND: Await contentlayer data for absolute build-time synchronization
    const data = await getContentlayerData();
    const allDocs = getPublishedDocuments();
    
    const booksDocs = allDocs.filter((d: any) => {
      const dir = String(d._raw?.sourceFileDir || "").toLowerCase();
      return dir.includes('books') || dir.includes('volumes');
    });

    const books: BookListItem[] = booksDocs
      .map((b: any) => ({
        slug: normalizeSlug(b.slugComputed || b.slug || b._raw?.flattenedPath || ""),
        title: b.title ?? "Untitled",
        subtitle: b.subtitle ?? null,
        excerpt: b.excerpt ?? b.description ?? null,
        coverImage: b.coverImage ?? b.image ?? null,
        readTime: b.readTime ?? null,
        tags: Array.isArray(b.tags) ? b.tags : [],
        featured: Boolean(b.featured),
        author: b.author ?? "Abraham of London",
        publishedDate: b.date ?? b.publishedDate ?? null,
        series: b.series ?? null,
        href: `/books/${normalizeSlug(b.slugComputed || b.slug || b._raw?.flattenedPath || "").replace(/^books\//, '')}`,
      }))
      // INTEGRITY MODE: show only /books/* and ensure title existence
      .filter((x) => x.href.startsWith("/books/") && Boolean(x.title))
      .sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        const da = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
        const db = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
        return db - da;
      });

    const popularTags = Array.from(new Set(books.flatMap(b => b.tags))).slice(0, 12);
    const seriesList = Array.from(new Set(books.map(b => b.series).filter(Boolean) as string[]));

    return { 
      props: sanitizeData({ 
        books, 
        featuredBooks: books.filter(b => b.featured),
        popularTags,
        seriesList
      }), 
      revalidate: 3600 
    };
  } catch (error) {
    console.error("[BOOKS_INDEX_FAILURE]", error);
    return { props: { books: [], featuredBooks: [], popularTags: [], seriesList: [] }, revalidate: 3600 };
  }
};

export default BooksPage;