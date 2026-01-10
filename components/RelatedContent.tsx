import React from "react";
import Link from "next/link";
import Image from "next/image";

interface RelatedItem {
  slug: string;
  title: string;
  summary?: string;
  coverImage?: string;
  type: "blog" | "event" | "download";
}

interface RelatedContentProps {
  items: RelatedItem[];
  className?: string;
}

export default function RelatedContent({
  items,
  className = "",
}: RelatedContentProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className={`related-content mt-12 ${className}`}>
      <h2 className="text-2xl font-serif font-semibold text-deepCharcoal mb-6">
        Related Content
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/${item.type === "download" ? "downloads" : item.type}s/${item.slug}`}
            className="group block overflow-hidden rounded-lg border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover"
          >
            {item.coverImage && (
              <div className="relative aspect-[3/2] w-full">
                <Image
                  src={item.coverImage}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold text-deepCharcoal group-hover:underline">
                {item.title}
              </h3>
              {item.summary && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {item.summary}
                </p>
              )}
              <span className="inline-block mt-2 text-xs font-medium text-forest uppercase tracking-wide">
                {item.type}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

