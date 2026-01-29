// components/books/RelatedBooks.tsx
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { safeArraySlice } from "@/lib/utils/safe";
import { ArrowRight, BookOpen, Star } from "lucide-react";

interface RelatedBook {
  id?: string; // Make optional
  title: string;
  author?: string; // Make optional
  description?: string; // Make optional
  rating?: number; // Make optional
  price?: number; // Make optional
  coverImage?: string; // Make optional
  slug: string;
  category?: string; // Make optional
}

interface RelatedBooksProps {
  books?: RelatedBook[]; // Make optional
  currentBookSlug?: string;
  currentBookId?: string;
}

const RelatedBooks: React.FC<RelatedBooksProps> = ({ 
  books = [], 
  currentBookSlug,
  currentBookId 
}) => {
  const [isClient, setIsClient] = React.useState(false);
  const [relatedBooks, setRelatedBooks] = React.useState<RelatedBook[]>([]);

  React.useEffect(() => {
    setIsClient(true);
    
    // Only process on client side
    if (typeof window === 'undefined') return;

    const currentBook = currentBookSlug || currentBookId;
    
    // SAFE: Handle undefined/null books
    const safeBooks = Array.isArray(books) ? books : [];
    
    // Filter out current book safely
    const filteredBooks = safeArraySlice(
      safeBooks.filter((book) => {
        if (!book || !currentBook) return true;
        
        // Ensure book has required properties
        if (!book.title || !book.slug) return false;
        
        // Try to match by ID or slug
        if (book.id && book.id === currentBook) return false;
        if (book.slug && book.slug === currentBook) return false;
        
        return true;
      }),
      0,
      3
    );

    setRelatedBooks(filteredBooks);
  }, [books, currentBookSlug, currentBookId]);

  // Don't render on server during SSG - return loading skeleton
  if (!isClient) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-white/5 animate-pulse rounded-xl"></div>
        ))}
      </div>
    );
  }

  // If no books to display, show fallback
  if (relatedBooks.length === 0) {
    return (
      <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
        <BookOpen className="w-8 h-8 text-gray-500 mx-auto mb-2" />
        <p className="text-xs text-gray-500">No related books available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">Related Intelligence</h3>
          <p className="text-sm text-gray-400">More from the collection</p>
        </div>
        <Link
          href="/books"
          className="text-sm text-gold hover:text-gold/80 font-semibold flex items-center gap-1"
        >
          <span>Browse All</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="space-y-4">
        {relatedBooks.map((book) => (
          <Link 
            key={book.slug || book.id || `book-${Math.random()}`}
            href={`/books/${book.slug}`}
            className="group block"
          >
            <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-4 hover:bg-white/5 hover:border-gold/30 transition-all duration-300 group-hover:scale-[1.02]">
              <div className="flex gap-4">
                <div className="relative w-16 h-24 flex-shrink-0 rounded overflow-hidden border border-white/10">
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
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white group-hover:text-gold transition-colors truncate">
                        {book.title || 'Untitled Book'}
                      </h4>
                      <p className="text-sm text-gray-400 truncate">
                        by {book.author || 'Abraham of London'}
                      </p>
                    </div>
                    
                    {book.price !== undefined && (
                      <div className="text-gold font-bold text-sm">
                        ${book.price.toFixed(2)}
                      </div>
                    )}
                  </div>
                  
                  {book.rating !== undefined && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(book.rating || 0)
                                ? 'text-yellow-400 fill-yellow-400'
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
                    <span className="inline-block px-2 py-1 bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-widest rounded">
                      {book.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedBooks;