import React from "react";
import Link from "next/link";
import clsx from "clsx";

import BlogPostCard from "@/components/BlogPostCard";
import BookCard from "@/components/BookCard";

type ContentShowcaseProps = {
  title: string;
  subtitle?: string;
  items: any[];
  type: "post" | "book";
  link: string;
  linkText?: string;
  linkAriaLabel?: string;
  className?: string;
};

export default function ContentShowcase({
  title,
  subtitle,
  items,
  type,
  link,
  linkText = "View all",
  linkAriaLabel = "View all items",
  className,
}: ContentShowcaseProps) {
  // Only render if there are items to display
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className={clsx("py-12 px-4", className)}
      aria-label={title}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="bg-white text-deepCharcoal rounded-3xl shadow-2xl ring-1 ring-black/5 p-6 md:p-10">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-2 text-base text-deepCharcoal/80">{subtitle}</p>
              )}
            </div>
            <Link
              href={link}
              className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-forest text-cream hover:bg-forest/90 transition"
              aria-label={linkAriaLabel}
            >
              {linkText}
            </Link>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item: any) =>
              type === "post" ? (
                <BlogPostCard key={item.slug} {...item} />
              ) : (
                <BookCard key={item.slug} {...item} />
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
