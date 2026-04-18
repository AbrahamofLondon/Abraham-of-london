// components/books/BookListCard.tsx
// Thin composition: Book card for index/grid layouts.
// Uses CardShell for shell. SmartCover for cover image. All ds-* tokens.
// Cover-led: the image is prominent, metadata is secondary.

"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CardShell } from "@/components/primitives/CardShell";
import { SmartCover } from "@/components/primitives/SmartCover";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BookListItem = {
  url: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  date?: string | null;
  readTime?: string | null;
  tags?: string[];
  coverImage: string;
  featured?: boolean;
};

export type BookListCardProps = {
  book: BookListItem;
  priority?: boolean;
  className?: string;
};

// ---------------------------------------------------------------------------
// BookListCard
// ---------------------------------------------------------------------------

function BookListCard({
  book,
  priority = false,
  className,
}: BookListCardProps) {
  return (
    <Link href={book.url || "#"} className={["group block", className].filter(Boolean).join(" ")}>
      <CardShell
        as="div"
        variant="default"
        density="balanced"
        interactive
        className="h-full rounded-3xl ds-panel"
      >
        <SmartCover
          src={book.coverImage}
          alt={book.title}
          aspect="portrait"
          priority={priority}
          sizes="(max-width: 768px) 100vw, 420px"
          overlay={false}
          scrim={false}
        />

        <div className="mt-5">
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-mono uppercase tracking-[0.35em]">
            {book.date ? (
              <span className="ds-accent">{book.date}</span>
            ) : null}
            {book.readTime ? (
              <span className="ds-text-subtle">{book.readTime}</span>
            ) : null}
            {book.tags?.[0] ? (
              <span className="ds-text-subtle">{book.tags[0]}</span>
            ) : null}
          </div>

          {/* Title */}
          <h2 className="mt-4 line-clamp-2 font-serif text-2xl tracking-tight transition-colors ds-text">
            {book.title}
          </h2>

          {/* Subtitle */}
          {book.subtitle ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed ds-text-muted">
              {book.subtitle}
            </p>
          ) : null}

          {/* Excerpt (featured only — keeps density controlled) */}
          {book.featured && book.excerpt ? (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed ds-text-subtle">
              {book.excerpt}
            </p>
          ) : null}

          {/* CTA */}
          <div className="mt-5 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.35em] ds-accent">
            Open
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </CardShell>
    </Link>
  );
}

export { BookListCard };
export default BookListCard;
