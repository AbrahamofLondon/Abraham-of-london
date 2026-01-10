// pages/books/index.tsx - BOOKS INDEX PAGE
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
  Tag,
  ChevronRight,
  Library,
  TrendingUp,
  Award
} from "lucide-react";

import Layout from "@/components/Layout";
import SilentSurface from "@/components/ui/SilentSurface";
import { 
  getContentlayerData, 
  normalizeSlug,
  getPublishedDocuments,
  isDraftContent
} from "@/lib/contentlayer-compat";

export type BookListItem = {
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  description: string | null;
  coverImage: string | null;
  readTime: string | null;
  tags: string[];
  featured: boolean;
  author: string | null;
  publishedDate: string | null;
  category?: string | null;
  series?: string | null;
  volume?: string | null;
  status?: string | null;
};

interface BooksPageProps {
  books: BookListItem[];
  featuredBooks?: BookListItem[];
  popularTags?: string[];
  seriesList?: string[];
}

const BooksPage: NextPage<BooksPageProps> = ({ 
  books, 
  featuredBooks = [], 
  popularTags = [], 
  seriesList = [] 
}) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
  const [selectedSeries, setSelectedSeries] = React.useState<string | null>(null);
  const [visibleBooks, setVisibleBooks] = React.useState(books);
  const [showFilters, setShowFilters] = React.useState(false);

  // Filter books based on search and filters
  React.useEffect(() => {
    let filtered = books;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(term) || 
        book.subtitle?.toLowerCase().includes(term) ||
        book.excerpt?.toLowerCase().includes(term) ||
        book.author?.toLowerCase().includes(term) ||
        book.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    if (selectedTag) {
      filtered = filtered.filter(book => 
        book.tags?.includes(selectedTag)
      );
    }
    
    if (selectedSeries) {
      filtered = filtered.filter(book => 
        book.series === selectedSeries
      );
    }
    
    setVisibleBooks(filtered);
  }, [books, searchTerm, selectedTag, selectedSeries]);

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  };

  const handleSeriesClick = (series: string) => {
    setSelectedSeries(selectedSeries === series ? null : series);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTag(null);
    setSelectedSeries(null);
  };

  const hasActiveFilters = searchTerm || selectedTag || selectedSeries;

  return (
    <Layout
      title="Volumes & Manuscripts"
      description="Long-form works, teaching editions, and canonical volumes from the Abraham of London canon."
      className="bg-charcoal min-h-screen"
    >
      <Head>
        <title>Books & Volumes | Abraham of London</title>
        <meta
          name="description"
          content="Volumes, teaching editions, and long-form works from Abraham of London. Explore the complete canon."
        />
        <meta property="og:title" content="Books & Volumes | Abraham of London" />
        <meta
          property="og:description"
          content="Explore the volumes and manuscripts that underpin the Abraham of London canon."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://abrahamoflondon.com/books" />
        <meta property="og:image" content="/assets/images/books-og.webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://abrahamoflondon.com/books" />
      </Head>

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b from-black via-[#050608] to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.12),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(205,127,50,0.09),_transparent_55%)]" />
        <div className="container relative mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold/70">
                <Library className="w-4 h-4" />
                <span>Canon · Volumes</span>
              </div>
            </div>
            <h1 className="mb-4 font-serif text-4xl font-normal tracking-tight text-cream sm:text-5xl lg:text-6xl">
              Books & Volumes
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/70">
              Long-form works that sit behind the shorts, posts, and soundbites:
              the manuscripts where the arguments are built properly.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search books, authors, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-transparent text-white placeholder-white/40"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2 border border-white/10"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Quick Filter - Featured Books */}
          {featuredBooks.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-gold" />
                <h3 className="text-sm font-medium text-white/70">Featured Volumes</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {featuredBooks.slice(0, 4).map(book => (
                  <button
                    key={book.slug}
                    onClick={() => setSearchTerm(book.title)}
                    className="px-4 py-2 bg-gold/10 text-gold rounded-xl hover:bg-gold/20 transition-colors text-sm border border-gold/20"
                  >
                    {book.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Filter - Popular Tags */}
          {popularTags.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-gold" />
                <h3 className="text-sm font-medium text-white/70">Popular Topics</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularTags.slice(0, 8).map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      selectedTag === tag
                        ? 'bg-gold text-charcoal'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Full Filter Panel */}
          {showFilters && (
            <div className="mb-6 p-6 bg-white/5 rounded-2xl border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tags Filter */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      All Topics
                    </h3>
                    {selectedTag && (
                      <button
                        onClick={() => setSelectedTag(null)}
                        className="text-sm text-gold hover:text-gold/80"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                    {[...new Set(books.flatMap(b => b.tags))].map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          selectedTag === tag
                            ? 'bg-gold text-charcoal font-medium'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Series Filter */}
                {seriesList.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Series
                      </h3>
                      {selectedSeries && (
                        <button
                          onClick={() => setSelectedSeries(null)}
                          className="text-sm text-gold hover:text-gold/80"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {seriesList.map(series => (
                        <button
                          key={series}
                          onClick={() => handleSeriesClick(series)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            selectedSeries === series
                              ? 'bg-gold/20 text-gold border border-gold/30'
                              : 'bg-white/5 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          {series}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Clear All Button */}
              {hasActiveFilters && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/15 transition-colors text-sm"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mb-6">
              <div className="flex items-center gap-3 text-sm text-white/60 flex-wrap">
                <span>Showing {visibleBooks.length} of {books.length} volumes</span>
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className="px-3 py-1 bg-white/5 rounded-full">
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {selectedTag && (
                    <span className="px-3 py-1 bg-gold/20 text-gold rounded-full flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {selectedTag}
                    </span>
                  )}
                  {selectedSeries && (
                    <span className="px-3 py-1 bg-white/5 rounded-full flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {selectedSeries}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="mb-8 flex flex-col items-center justify-between gap-4 border-b border-white/10 pb-4 text-sm text-white/50 md:flex-row">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gold/80" />
            <span>
              {books.length} {books.length === 1 ? "volume" : "volumes"} currently available
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-gold" />
              {books.filter((b) => b.featured).length} featured volumes
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-white/40" />
              {books.filter((b) => b.publishedDate !== null).length} dated
            </span>
            {seriesList.length > 0 && (
              <span className="flex items-center gap-1">
                <Library className="h-3 w-3 text-white/40" />
                {seriesList.length} series
              </span>
            )}
          </div>
        </div>

        {/* Books Grid */}
        {visibleBooks.length === 0 ? (
          <div className="py-20 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-6">
              <Search className="h-8 w-8 text-white/30" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              No volumes found
            </h3>
            <p className="text-white/60 mb-8">
              {searchTerm 
                ? `No volumes match "${searchTerm}". Try a different search term.`
                : "No volumes available in this category."
              }
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-gold text-charcoal font-medium rounded-xl hover:bg-gold/90 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {selectedSeries && (
              <div className="mb-8">
                <h2 className="text-2xl font-serif font-normal text-cream mb-4">
                  Series: {selectedSeries}
                </h2>
                <p className="text-white/60">
                  {visibleBooks.length} volume{visibleBooks.length !== 1 ? 's' : ''} in this series
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleBooks.map((book) => (
                <Link
                  key={book.slug}
                  href={`/books/${book.slug}`}
                  className="group block h-full"
                  aria-label={`View ${book.title}`}
                >
                  <SilentSurface className="flex h-full flex-col overflow-hidden" hover>
                    {book.coverImage ? (
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <Image
                          src={book.coverImage}
                          alt={book.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        {book.featured && (
                          <div className="absolute left-3 top-3">
                            <div className="flex items-center gap-1 rounded-full border border-gold/40 bg-gold/15 px-2 py-1 backdrop-blur-sm">
                              <Sparkles className="h-3 w-3 text-gold" />
                              <span className="text-[10px] font-medium text-cream">
                                Featured Volume
                              </span>
                            </div>
                          </div>
                        )}
                        {book.series && (
                          <div className="absolute right-3 top-3">
                            <div className="rounded-full bg-black/60 backdrop-blur-sm px-2 py-1">
                              <span className="text-[10px] font-medium text-white/70">
                                {book.series}
                                {book.volume && ` Vol. ${book.volume}`}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-charcoal to-softBlack">
                        <div className="text-center">
                          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                            <BookOpen className="h-6 w-6 text-white/30" />
                          </div>
                          <p className="text-xs text-white/40">Cover in preparation</p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h2 className="line-clamp-2 font-serif text-lg font-normal text-cream">
                            {book.title}
                          </h2>
                          {book.subtitle && (
                            <p className="mt-1 line-clamp-1 text-sm text-white/50">
                              {book.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {book.excerpt && (
                        <p className="mb-4 line-clamp-3 text-sm text-white/60">
                          {book.excerpt}
                        </p>
                      )}

                      {book.author && (
                        <div className="mb-3 text-xs text-white/50">
                          <span className="font-medium">By {book.author}</span>
                        </div>
                      )}

                      <div className="mt-auto space-y-3">
                        <div className="flex items-center justify-between text-xs text-white/45">
                          <div className="flex items-center gap-3">
                            {book.publishedDate && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(book.publishedDate).toLocaleDateString("en-GB", {
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            )}
                            {book.readTime && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {book.readTime}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs text-white/45">
                          <div className="flex flex-wrap gap-1">
                            {book.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="rounded-full bg-white/5 px-2 py-1">
                                #{tag}
                              </span>
                            ))}
                            {book.tags.length > 3 && (
                              <span className="text-white/35">
                                +{book.tags.length - 3} more
                              </span>
                            )}
                          </div>
                          <ArrowRight className="h-3 w-3 text-white/40 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </SilentSurface>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* CTA Section */}
        {!hasActiveFilters && (
          <div className="mt-16 p-8 bg-gradient-to-r from-gold/10 to-amber-900/10 rounded-2xl border border-gold/20">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-2xl font-serif font-normal text-cream mb-3">
                Access the complete canon
              </h3>
              <p className="text-white/60 mb-6">
                Join the Inner Circle for full access to all volumes, including early drafts and member-exclusive works.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Link
                  href="/inner-circle"
                  className="px-6 py-3 bg-gold text-charcoal font-medium rounded-xl hover:bg-gold/90 transition-colors text-center"
                >
                  Explore Inner Circle
                </Link>
                <Link
                  href="/canon"
                  className="px-6 py-3 bg-white/5 text-white font-medium rounded-xl hover:bg-white/10 transition-colors text-center border border-white/10"
                >
                  View Canon Overview
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<BooksPageProps> = async () => {
  try {
    await getContentlayerData();
    const allDocs = getPublishedDocuments();
    
    // Filter books only
    const booksDocs = allDocs.filter((d: any) => {
      const kind = String(d._raw?.sourceFileDir || d.kind || "").toLowerCase();
      const tags = Array.isArray(d.tags) ? d.tags.map((t: string) => t.toLowerCase()) : [];
      
      return (
        kind.includes('book') || 
        kind.includes('volume') || 
        tags.includes('book') ||
        tags.includes('volume') ||
        tags.includes('canon') ||
        (d.category && d.category.toLowerCase().includes('book')) ||
        (d.url && d.url.includes('/books/'))
      );
    });

    const books: BookListItem[] = booksDocs
      .map((b: any) => {
        const publishedDate =
          typeof b.date === "string" ? b.date : typeof b.publishedDate === "string" ? b.publishedDate : null;

        return {
          slug: normalizeSlug(b.slugComputed || b.slug || b._raw?.flattenedPath || ""),
          title: b.title ?? "Untitled",
          subtitle: b.subtitle ?? null,
          excerpt: (b.excerpt ?? b.description) ?? null,
          description: b.description ?? null,
          coverImage: b.coverImage ?? b.image ?? null,
          readTime: b.readTime ?? null,
          tags: Array.isArray(b.tags) ? b.tags : [],
          featured: Boolean(b.featured),
          author: b.author ?? null,
          publishedDate,
          category: b.category,
          series: b.series,
          volume: b.volume,
          status: b.status,
        };
      })
      .sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;

        const da = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
        const db = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
        if (da !== db) return db - da;

        return a.title.localeCompare(b.title);
      });

    // Get popular tags
    const tagCounts: Record<string, number> = {};
    books.forEach(book => {
      book.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const popularTags = Object.entries(tagCounts)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 15);

    // Get series list
    const seriesList = [...new Set(books.map(b => b.series).filter(Boolean))].sort();

    // Get featured books
    const featuredBooks = books.filter(book => book.featured).slice(0, 4);

    console.log(`📚 Books index: Loaded ${books.length} books, ${featuredBooks.length} featured`);

    return { 
      props: { 
        books, 
        featuredBooks,
        popularTags,
        seriesList 
      }, 
      revalidate: 3600 
    };
  } catch (error) {
    console.error('Error generating books index:', error);
    return {
      props: { 
        books: [],
        featuredBooks: [],
        popularTags: [],
        seriesList: []
      },
      revalidate: 3600
    };
  }
};

export default BooksPage;