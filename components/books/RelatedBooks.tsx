import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Star } from "lucide-react";

interface RelatedBook {
  id?: string;
  title: string;
  author?: string;
  description?: string;
  rating?: number;
  price?: number;
  coverImage?: string;
  slug: string;
  category?: string;
}

interface RelatedBooksProps {
  books?: RelatedBook[];
  currentBookSlug?: string;
  currentBookId?: string;
}

const RelatedBooks: React.FC<RelatedBooksProps> = ({
  books = [],
  currentBookSlug,
  currentBookId,
}) => {
  const [isClient, setIsClient] = React.useState(false);
  const [relatedBooks, setRelatedBooks] = React.useState<RelatedBook[]>([]);

  React.useEffect(() => {
    setIsClient(true);
    if (typeof window === 'undefined') return;

    // Safely get current book identifier
    const currentBook = currentBookSlug || currentBookId;
    if (!currentBook) {
      setRelatedBooks([]);
      return;
    }

    // Validate books array
    const safeBooks = Array.isArray(books) ? books : [];

    // Filter out current book and ensure valid entries
    const filtered = safeBooks.filter((book): book is RelatedBook => {
      if (!book) return false;
      if (!book.title || !book.slug) return false;
      if (book.id && book.id === currentBook) return false;
      if (book.slug && book.slug === currentBook) return false;
      return true;
    });

    // ✅ Native slice – preserves RelatedBook[] type
    setRelatedBooks(filtered.slice(0, 3));
  }, [books, currentBookSlug, currentBookId]);

  if (!isClient) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-white/5 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (relatedBooks.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
        <BookOpen className="mx-auto mb-2 h-8 w-8 text-gray-500" />
        <p className="text-xs text-gray-500">No related books available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Related Intelligence</h3>
          <p className="text-sm text-gray-400">More from the collection</p>
        </div>
        <Link
          href="/books"
          className="flex items-center gap-1 text-sm font-semibold text-gold hover:text-gold/80"
        >
          <span>Browse All</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-4">
        {relatedBooks.map((book) => {
          const key = book.slug || book.id || `book-${Math.random()}`;
          return (
            <Link
              key={key}
              href={`/books/${book.slug}`}
              className="group block"
            >
              <div className="relative rounded-xl border border-white/10 bg-zinc-900/60 p-4 transition-all duration-300 hover:border-gold/30 hover:bg-white/5 group-hover:scale-[1.02]">
                <div className="flex gap-4">
                  {/* Cover */}
                  <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded border border-white/10">
                    {book.coverImage ? (
                      <Image
                        src={book.coverImage}
                        alt={book.title || 'Book cover'}
                        fill
                        className="object-cover"
                        sizes="64px"
                        unoptimized={book.coverImage?.startsWith('/')}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/5">
                        <BookOpen className="h-8 w-8 text-gray-500" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex-1 truncate">
                        <h4 className="truncate font-semibold text-white transition-colors group-hover:text-gold">
                          {book.title || 'Untitled Book'}
                        </h4>
                        <p className="truncate text-sm text-gray-400">
                          by {book.author || 'Abraham of London'}
                        </p>
                      </div>
                      {book.price !== undefined && (
                        <div className="text-sm font-bold text-gold">
                          ${book.price.toFixed(2)}
                        </div>
                      )}
                    </div>

                    {book.rating !== undefined && (
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < Math.floor(book.rating || 0)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">
                          {(book.rating || 0).toFixed(1)}
                        </span>
                      </div>
                    )}

                    {book.category && (
                      <span className="inline-block rounded bg-gold/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gold">
                        {book.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedBooks;