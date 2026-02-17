// components/homepage/CanonInstitutionalIntro.tsx
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
  href: string;      // landing or book page
  canonHref: string; // /canon
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

        {/* Main row */}
        <div className="mt-7 grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          {/* Cover */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-amber-500/20 via-amber-500/8 to-transparent blur-xl opacity-70" />
              <div className="relative rounded-2xl border border-amber-500/25 bg-black/50 p-2">
                <Image
                  src={cover}
                  alt={`${title} cover`}
                  width={160}
                  height={220}
                  className="h-auto w-[120px] rounded-xl border border-amber-500/30 shadow-xl sm:w-[135px]"
                />
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-white/45">
                Limited release
              </div>
              <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-white/95 leading-tight">
                {title}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-amber-200/70 font-mono uppercase tracking-[0.22em]">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Copy + CTAs */}
          <div className="space-y-5">
            <p className="text-sm sm:text-base text-white/70 leading-relaxed">
              <span className="text-white/85">Not random content.</span> One doctrinal spine powering the library.
              Start with the Prelude—then enter the Canon properly.
            </p>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-amber-200/70">
                Worldview frame
              </div>
              <p className="mt-2 text-sm sm:text-base font-serif text-white/85 leading-relaxed line-clamp-3">
                {excerpt}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={primaryHref}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-[11px] font-mono uppercase tracking-[0.28em] text-black hover:from-amber-400 hover:to-amber-500 transition-all"
              >
                <BookOpen className="h-4 w-4" />
                {ctaLabel}
                <ChevronRight className="h-4 w-4" />
              </Link>

              <Link
                href={canonHref}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-6 py-3 text-[11px] font-mono uppercase tracking-[0.28em] text-white/80 hover:border-white/18 hover:bg-white/10 transition-all"
              >
                Browse Canon
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom micro-structure (short) */}
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
      <div className="mt-1.5 text-sm text-white/60 leading-relaxed">{body}</div>
    </div>
  );
}