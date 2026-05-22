// components/essays/EssayCard.tsx
// Thin composition: Essay/blog card.
// Uses CardShell for shell. SmartCover for image. All ds-* tokens.
// Supports default (full card with cover) and compact (list-style) variants.

"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CardShell } from "@/components/primitives/CardShell";
import { SmartCover } from "@/components/primitives/SmartCover";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EssayCardItem = {
  url: string;
  title: string;
  excerpt?: string | null;
  date?: string | null;
  readTime?: string | null;
  tags?: string[];
  coverImage: string;
  coverAspect?: string | null;
  coverFit?: string | null;
  coverPosition?: string | null;
  /** Series badge fields — only populated for series essay cards */
  seriesLabel?: string | null;   // e.g. "Applied Essay Series"
  seriesTitle?: string | null;   // e.g. "The Burden Changes Hands"
  partNumber?: number | null;    // e.g. 3
  partOf?: number | null;        // e.g. 7
  seriesHref?: string | null;    // e.g. "/blog/series/the-burden-changes-hands"
};

export type EssayCardProps = {
  post: EssayCardItem;
  variant?: "default" | "compact";
  priority?: boolean;
  className?: string;
};

// ---------------------------------------------------------------------------
// Compact variant (list card)
// ---------------------------------------------------------------------------

function CompactEssayCard({ post, className }: { post: EssayCardItem; className?: string }) {
  const hasSeries = !!(post.seriesLabel && post.seriesTitle);

  return (
    <Link href={post.url || "#"} className={["group block", className].filter(Boolean).join(" ")}>
      <CardShell
        as="div"
        variant="default"
        density="compact"
        className="hover:ds-panel-alt"
      >
        {hasSeries && (
          <div className="mb-2 text-[9px] font-mono uppercase tracking-[0.3em] ds-accent">
            {post.seriesLabel}
            {post.partNumber != null && post.partOf != null
              ? ` · Part ${post.partNumber} of ${post.partOf}`
              : ""}
          </div>
        )}
        <div className="text-[10px] font-mono uppercase tracking-[0.32em] ds-text-subtle">
          {post.date || "Undated"}
          {post.readTime ? ` · ${post.readTime}` : ""}
        </div>
        <div className="mt-2 font-serif text-[1.2rem] leading-tight transition-colors ds-text">
          {post.title}
        </div>
        {hasSeries && post.seriesTitle ? (
          <div className="mt-1 text-[9px] font-mono italic ds-text-subtle">
            {post.seriesTitle}
          </div>
        ) : null}
        {post.excerpt ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed ds-text-muted">
            {post.excerpt}
          </p>
        ) : null}
      </CardShell>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Default variant (full card with cover)
// ---------------------------------------------------------------------------

export default function EssayCard({
  post,
  variant = "default",
  priority = false,
  className,
}: EssayCardProps) {
  if (variant === "compact") {
    return <CompactEssayCard post={post} className={className} />;
  }

  const hasSeries = !!(post.seriesLabel && post.seriesTitle);

  return (
    <Link href={post.url || "#"} className={["group block", className].filter(Boolean).join(" ")}>
      <CardShell
        as="div"
        variant="default"
        density="balanced"
        interactive
        className="h-full ds-panel"
      >
        <SmartCover
          src={post.coverImage}
          alt={post.title}
          aspect={(post.coverAspect as any) || "landscape"}
          fit={(post.coverFit as any) || "cover"}
          position={post.coverPosition || "center"}
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          overlay={false}
          scrim={false}
        />

        {/* Series badge — shown when card is a series part */}
        {hasSeries && (
          <div className="mt-4 flex items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-[9px] font-mono uppercase tracking-[0.3em]"
              style={{
                backgroundColor: "rgba(201,150,58,0.12)",
                color: "var(--ds-accent)",
                border: "1px solid rgba(201,150,58,0.25)",
              }}
            >
              {post.seriesLabel}
              {post.partNumber != null && post.partOf != null
                ? ` · Part ${post.partNumber} of ${post.partOf}`
                : ""}
            </span>
            <span className="text-[9px] font-mono italic ds-text-subtle">
              {post.seriesTitle}
            </span>
          </div>
        )}

        {/* Meta row */}
        <div className={["flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-mono uppercase tracking-[0.32em]", hasSeries ? "mt-3" : "mt-4"].join(" ")}>
          {post.date ? (
            <span className="ds-accent">{post.date}</span>
          ) : null}
          {post.readTime ? (
            <span className="ds-text-subtle">{post.readTime}</span>
          ) : null}
        </div>

        {/* Title */}
        <h2 className="mt-3 font-serif text-[1.35rem] leading-[1.02] tracking-[-0.03em] transition-colors md:text-[1.55rem] ds-text">
          {post.title}
        </h2>

        {/* Excerpt */}
        {post.excerpt ? (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed ds-text-muted">
            {post.excerpt}
          </p>
        ) : null}

        {/* Footer: tags + CTA */}
        <div className="mt-5 flex items-center justify-between gap-4 border-t pt-4 ds-border">
          <div className="flex min-w-0 flex-wrap gap-2">
            {(post.tags || []).slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full border px-3 py-1 text-[9px] font-mono uppercase tracking-[0.22em] ds-border ds-panel-alt ds-text-muted"
              >
                {tag}
              </span>
            ))}
          </div>

          <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.32em] ds-accent">
            Open
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </CardShell>
    </Link>
  );
}

export { CompactEssayCard };
