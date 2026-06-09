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
import Image from "next/image";

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
// Portrait-cover detection
//
// Returns true when the post's cover is a portrait or book image that should
// NOT be forced into a landscape frame (which creates a large dark matte).
// Landscape/wide/square covers continue to use the standard landscape slot.
// ---------------------------------------------------------------------------

export function isPortraitCover(post: Pick<EssayCardItem, "coverAspect" | "coverFit">): boolean {
  const aspect = post.coverAspect;
  if (aspect === "book" || aspect === "portrait") return true;
  // Explicit portrait-ratio strings from frontmatter ("3/4", "4/5", "3:4", "4:5")
  if (typeof aspect === "string" && /^[34][/:][45]$/.test(aspect)) return true;
  return false;
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
  // Portrait/book covers: side-by-side layout (cover left, text right).
  // This avoids the wide-landscape-matte problem where a centred portrait image
  // sits in a full-width card with empty dark space on either side.
  const portraitCover = isPortraitCover(post);

  // ── Portrait card: horizontal book-shelf layout ─────────────────────────────
  if (portraitCover) {
    return (
      <Link href={post.url || "#"} className={["group block", className].filter(Boolean).join(" ")}>
        <div
          className="ds-panel rounded-lg overflow-hidden flex transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--ds-shadow-lg)]"
          style={{
            transitionDuration: "var(--ds-duration-base)",
            transitionTimingFunction: "var(--ds-ease-standard)",
          }}
        >
          {/* Left: portrait book cover — fixed-width, stretches to card height */}
          <div
            className="relative w-[160px] shrink-0 min-h-[240px] sm:w-[220px] sm:min-h-[280px]"
            style={{ backgroundColor: "var(--ds-background-muted, #1a1a1e)" }}
          >
            <Image
              src={post.coverImage || "/assets/images/writing-desk.webp"}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              style={{ objectPosition: post.coverPosition || "center" }}
              sizes="(max-width: 640px) 160px, 220px"
              priority={priority}
            />
          </div>

          {/* Right: text content */}
          <div className="flex flex-1 flex-col p-5 min-w-0 sm:p-6">
            {/* Series badge */}
            {hasSeries && (
              <div className="mb-3 flex items-center gap-2">
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
              </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono uppercase tracking-[0.32em]">
              {post.date ? <span className="ds-accent">{post.date}</span> : null}
              {post.readTime ? <span className="ds-text-subtle">{post.readTime}</span> : null}
            </div>

            {/* Title */}
            <h2 className="mt-3 font-serif text-[1.2rem] leading-[1.05] tracking-[-0.02em] transition-colors sm:text-[1.4rem] ds-text">
              {post.title}
            </h2>

            {/* Excerpt */}
            {post.excerpt ? (
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed ds-text-muted flex-1">
                {post.excerpt}
              </p>
            ) : (
              <div className="flex-1" />
            )}

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
              <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.32em] ds-accent whitespace-nowrap">
                Open
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // ── Landscape card: standard stacked layout ─────────────────────────────────
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
          aspect="landscape"
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
