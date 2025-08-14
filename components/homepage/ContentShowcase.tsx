// components/homepage/ContentShowcase.tsx
import React from "react";
import Link from "next/link";
import clsx from "clsx";

import BlogPostCard from "@/components/BlogPostCard";
import BookCard from "@/components/BookCard";

type ContentShowcaseProps = {
  title: string;
  subtitle?: string;
  /** items = posts or books depending on `type` */
  items: any[];
  /** which card to render */
  type: "post" | "book";
  /** "See all" link */
  link: string;
  linkText?: string;
  /** allow extra styling from parent */
  className?: string;
};

export default function ContentShowcase({
  title,
  subtitle,
  items,
  type,
  link,
  linkText = "View all",
  className,
}: ContentShowcaseProps) {
  return (
    <section
      className={clsx("container mx-auto px-4 py-12 rounded-2xl", className)}
      aria-label={title}
    >
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-base text-deepCharcoal/80">{subtitle}</p>
          )}
        </div>
        <Link
          href={link}
          className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-forest text-cream hover:bg-emerald-700 transition"
        >
          {linkText}
        </Link>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item: any) => {
          if (type === "post") {
            return <BlogPostCard key={item.slug} {...item} />;
          }
          // type === 'book'
          return <BookCard key={item.slug} {...item} />;
        })}
      </div>
    </section>
  );
}



