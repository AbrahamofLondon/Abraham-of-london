import Link from "next/link";
import Image from "next/image";
import type { BookMeta } from "@/types/book";

interface BookCardProps extends BookMeta {
  featured?: boolean;
  className?: string;
}

export default function BookCard({
  slug,
  title,
  author,
  excerpt,
  coverImage,
  featured = false,
  className = ""
}: BookCardProps) {
  return (
    <div className={`group overflow-hidden rounded-2xl border border-lightGrey bg-white shadow-card transition-all hover:shadow-cardHover ${className}`}>
      {coverImage && (
        <div className="relative aspect-[3/4] w-full">
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {featured && (
            <div className="absolute top-2 right-2 bg-softGold text-deepCharcoal px-2 py-1 rounded-full text-xs font-semibold">
              Featured
            </div>
          )}
        </div>
      )}
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-deepCharcoal mb-2 line-clamp-2">
          <Link 
            href={`/books/${slug}`}
            className="hover:text-softGold transition-colors"
          >
            {title}
          </Link>
        </h3>
        
        <p className="text-sm text-gray-600 mb-2">by {author}</p>
        
        {excerpt && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {excerpt}
          </p>
        )}
        
        <Link
          href={`/books/${slug}`}
          className="inline-block w-full text-center rounded-lg bg-deepCharcoal text-cream px-4 py-2 text-sm font-medium hover:bg-[color:var(--color-on-secondary)/0.9] transition-colors"
        >
          Read More
        </Link>
      </div>
    </div>
  );
}