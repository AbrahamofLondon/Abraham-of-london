// components/canon/CanonHero.tsx — GROWN-UP, DISCIPLINED (BLACK + AMBER + ZINC)
import React from "react";
import Image from "next/image";
import {
  safeString,
  safeNumber,
  safeImageSrc,
  safeArray,
  classNames,
  safeFirstChar,
  safeSlice,
} from "@/lib/utils/safe";
import { BookOpen, Clock, Download, Calendar, ArrowRight, Sparkles } from "lucide-react";

interface CanonHeroProps {
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  coverImage?: string | null;
  category?: string | null;
  difficulty?: "beginner" | "intermediate" | "advanced" | string | null;
  estimatedHours?: number | null;
  version?: string | null;
  tags?: (string | null | undefined)[];
  author?: string | null;
  publishedDate?: string | Date | null;

  // Optional: allow caller to wire buttons without rewriting hero
  primaryHref?: string;
  secondaryHref?: string;
}

const difficultyConfig = {
  beginner: { label: "Foundations" },
  intermediate: { label: "Practitioner" },
  advanced: { label: "Advanced" },
} as const;

const CanonHero: React.FC<CanonHeroProps> = (props) => {
  const title = safeString(props.title, "Manuscript");
  const subtitle = safeString(props.subtitle);
  const description = safeString(
    props.description,
    "A disciplined text for builders—strategy, governance, and operational clarity."
  );
  const category = safeString(props.category, "Canon");
  const difficultyKey = safeString(props.difficulty, "beginner").toLowerCase() as keyof typeof difficultyConfig;
  const estimatedHours = safeNumber(props.estimatedHours, 0);
  const version = safeString(props.version, "1.0.0");
  const author = safeString(props.author, "Abraham of London");
  const tags = safeArray<string>(props.tags);

  const diff = difficultyConfig[difficultyKey] || difficultyConfig.beginner;

  const hoursText =
    estimatedHours > 0
      ? `${Math.round(estimatedHours)} ${Math.round(estimatedHours) === 1 ? "hour" : "hours"}`
      : "Self-paced";

  const formattedDate = props.publishedDate
    ? new Date(props.publishedDate).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Staged release";

  const imageSrc = safeImageSrc(props.coverImage);

  const primaryHref = props.primaryHref || "#";
  const secondaryHref = props.secondaryHref || "#";

  return (
    <section className="relative overflow-hidden bg-black">
      {/* disciplined surface */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.045] via-transparent to-transparent" />
        <div className="absolute inset-0 [background:radial-gradient(1100px_520px_at_18%_-10%,rgba(245,158,11,0.11),transparent_55%),radial-gradient(900px_480px_at_90%_10%,rgba(255,255,255,0.04),transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left */}
          <div className="space-y-8">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-4 py-2 text-sm font-semibold text-zinc-50">
                <Sparkles className="h-4 w-4 text-amber-300" />
                {category}
              </span>

              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-zinc-200">
                {diff.label}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-zinc-200">
                <Clock className="h-4 w-4 text-amber-300/90" />
                {hoursText}
              </span>

              <span className="font-mono text-xs text-zinc-500">v{version}</span>
            </div>

            {/* Title */}
            <div className="space-y-4">
              <h1 className="font-serif text-3xl md:text-5xl font-semibold tracking-tight text-zinc-50 leading-tight">
                {title}
              </h1>

              {subtitle ? (
                <p className="text-base md:text-xl text-zinc-300/90 font-light leading-relaxed">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {/* Description */}
            <p className="text-sm md:text-[15px] leading-relaxed text-zinc-300/90 font-light max-w-2xl">
              {description}
            </p>

            {/* Author / date */}
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-3 text-zinc-300/90">
                <div className="h-9 w-9 rounded-full bg-amber-300/10 border border-amber-300/15 flex items-center justify-center">
                  <span className="text-xs font-bold text-amber-200">
                    {safeFirstChar(author, "A")}
                  </span>
                </div>
                <span className="font-light">{author}</span>
              </div>

              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar className="h-4 w-4 text-amber-300/90" />
                <span className="font-light">{formattedDate}</span>
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {safeSlice(tags, 0, 6).map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}

            {/* Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href={primaryHref}
                className="group inline-flex items-center gap-2 rounded-xl bg-amber-300 px-6 py-3 font-semibold text-black hover:bg-amber-200 transition-colors shadow-lg shadow-amber-300/10"
              >
                <BookOpen className="h-5 w-5" />
                <span>Start Reading</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>

              <a
                href={secondaryHref}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300/25 bg-amber-300/[0.06] px-6 py-3 font-semibold text-zinc-50 hover:border-amber-300/40 hover:bg-amber-300/[0.10] transition-colors"
              >
                <Download className="h-5 w-5 text-amber-300" />
                <span>Download PDF</span>
              </a>
            </div>
          </div>

          {/* Right */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              {imageSrc ? (
                <div className="relative h-[440px] md:h-[520px]">
                  <Image
                    src={imageSrc}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                </div>
              ) : (
                <div className="h-[440px] md:h-[520px] bg-[radial-gradient(900px_480px_at_25%_0%,rgba(245,158,11,0.14),transparent_55%)]" />
              )}

              {/* Corner accents (subtle) */}
              <div className="pointer-events-none absolute top-0 left-0 h-12 w-12 border-t border-l border-amber-300/35 rounded-tl-2xl" />
              <div className="pointer-events-none absolute bottom-0 right-0 h-12 w-12 border-b border-r border-amber-300/35 rounded-br-2xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CanonHero;