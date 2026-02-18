// components/homepage/CanonInstitutionalIntro.tsx — 10/10 (A11y + image optimization)

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, ChevronRight, Layers } from "lucide-react";

export type CanonPrelude = {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
  href: string;
  canonHref: string;
  ctaLabel?: string | null;
};

export default function CanonInstitutionalIntro({
  prelude,
}: {
  prelude: CanonPrelude;
}): React.ReactElement {
  const title = prelude?.title || "The Architecture of Human Purpose";
  const subtitle = prelude?.subtitle || "Prelude MiniBook - Limited Release Edition";
  const excerpt =
    prelude?.excerpt ||
    prelude?.description ||
    "Human flourishing is not accidental. It is architectural.";

  const cover = prelude?.coverImage || "/assets/images/books/the-architecture-of-human-purpose.jpg";
  const primaryHref = prelude?.href || "/books/the-architecture-of-human-purpose-landing";
  const canonHref = prelude?.canonHref || "/canon";
  const ctaLabel = prelude?.ctaLabel || "Open the Prelude MiniBook";

  const focusRing =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

  return (
    <section className="bg-black">
      <div className="rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-950/18 to-black p-7 sm:p-8 md:p-10">
        {/* Top line */}
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/18 bg-amber-500/10 px-4 py-2">
            <Layers className="h-4 w-4 text-amber-300" />
            <span className="text-[10px] font-mono uppercase tracking-[0.32em] text-amber-200">
              Canon gateway
            </span>
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-amber-500/30 via-amber-500/10 to-transparent" />
        </div>

        <div className="mt-7 grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          {/* Cover */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-amber-500/20 via-amber-500/8 to-transparent blur-xl opacity-70" />
              <div className="relative rounded-2xl border border-amber-500/25 bg-black/50 p-2">
                <Image
                  src={cover}
                  alt={`${title} cover`}
                  width={220}
                  height={320}
                  loading="lazy"
                  quality={85}
                  sizes="(max-width: 640px) 120px, (max-width: 1024px) 140px, 160px"
                  className="h-auto w-[120px] rounded-xl border border-amber-500/30 shadow-xl sm:w-[140px] md:w-[160px]"
                />
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-white/55">
                Limited release
              </div>
              <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-white/95 leading-tight text-balance">
                {title}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-amber-200/80 font-mono uppercase tracking-[0.22em]">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Copy + CTAs */}
          <div className="space-y-5">
            <p className="text-sm sm:text-base text-white/75 leading-relaxed">
              <span className="text-white/90">Not random content.</span> One doctrinal spine powering the library.
              Start with the Prelude—then enter the Canon properly.
            </p>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-amber-200/80">
                Worldview frame
              </div>
              <p className="mt-2 text-sm sm:text-base font-serif text-white/90 leading-relaxed line-clamp-3">
                {excerpt}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={primaryHref}
                aria-label={ctaLabel}
                className={[
                  "relative overflow-hidden inline-flex items-center gap-2 rounded-2xl",
                  "bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3",
                  "text-[11px] font-mono uppercase tracking-[0.28em] text-black",
                  "transition-all duration-300 transform hover:-translate-y-0.5 hover:from-amber-400 hover:to-amber-500",
                  "after:absolute after:inset-0 after:bg-white/20 after:opacity-0 after:transition-opacity hover:after:opacity-100 after:rounded-[inherit]",
                  focusRing,
                ].join(" ")}
              >
                <BookOpen className="h-4 w-4 relative z-[1]" />
                <span className="relative z-[1]">{ctaLabel}</span>
                <ChevronRight className="h-4 w-4 relative z-[1]" />
              </Link>

              <Link
                href={canonHref}
                aria-label="Browse Canon"
                className={[
                  "inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-6 py-3",
                  "text-[11px] font-mono uppercase tracking-[0.28em] text-white/85",
                  "transition-all duration-300 transform hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/10",
                  focusRing,
                ].join(" ")}
              >
                Browse Canon
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom micro-structure */}
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <MiniPill title="Purpose architecture" body="Meaning, formation, direction." />
          <MiniPill title="Canon discipline" body="Frameworks, not vibes." />
          <MiniPill title="Operational use" body="Deployable models & tools." />
        </div>
      </div>
    </section>
  );
}

function MiniPill({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-1.5 text-sm text-white/65 leading-relaxed">{body}</div>
    </div>
  );
}