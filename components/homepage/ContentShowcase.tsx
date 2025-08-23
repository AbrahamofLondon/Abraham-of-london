import * as React from "react";
import Link from "next/link";
import clsx from "clsx";

import BlogPostCard from "@/components/BlogPostCard";
import BookCard from "@/components/BookCard";

/** Pull prop types from the cards and add common id fields for safe keys */
type BlogPostCardProps = React.ComponentProps<typeof BlogPostCard> & {
  slug?: string;
  id?: string;
};
type BookCardProps = React.ComponentProps<typeof BookCard> & {
  slug?: string;
  id?: string;
};

type BaseProps = {
  title: string;
  subtitle?: string;
  /** Optional “see all” link; button omitted if not provided */
  link?: string;
  linkText?: string;
  linkAriaLabel?: string;
  className?: string;
  /** Optionally cap the number of rendered items */
  max?: number;
};

type PostShowcase = BaseProps & { type: "post"; items: BlogPostCardProps[] };
type BookShowcase = BaseProps & { type: "book"; items: BookCardProps[] };

export type ContentShowcaseProps = PostShowcase | BookShowcase;

const keyOf = (item: { slug?: string; id?: string }, i: number) =>
  item.slug || item.id || i;

export default function ContentShowcase(props: ContentShowcaseProps) {
  const {
    title,
    subtitle,
    items: rawItems,
    type,
    link,
    linkText = "View all",
    linkAriaLabel = "View all items",
    className,
    max,
  } = props;

  const items = Array.isArray(rawItems)
    ? max
      ? rawItems.slice(0, max)
      : rawItems
    : [];

  if (!items.length) return null;

  const headingId = React.useId();
  const subId = subtitle ? React.useId() : undefined;

  return (
    <section
      role="region"
      aria-labelledby={headingId}
      aria-describedby={subId}
      className={clsx("py-12 px-4", className)}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="bg-white text-deepCharcoal rounded-3xl shadow-2xl ring-1 ring-black/5 p-6 md:p-10">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2
                id={headingId}
                className="text-3xl md:text-4xl font-serif font-bold tracking-tight"
              >
                {title}
              </h2>
              {subtitle && (
                <p id={subId} className="mt-2 text-base text-deepCharcoal/80">
                  {subtitle}
                </p>
              )}
            </div>

            {link && (
              <Link
                href={link}
                className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-forest text-cream hover:bg-forest/90 transition"
                aria-label={linkAriaLabel}
              >
                {linkText}
              </Link>
            )}
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) =>
              type === "post" ? (
                <BlogPostCard
                  key={keyOf(item as BlogPostCardProps, i)}
                  {...(item as BlogPostCardProps)}
                />
              ) : (
                <BookCard
                  key={keyOf(item as BookCardProps, i)}
                  {...(item as BookCardProps)}
                />
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
