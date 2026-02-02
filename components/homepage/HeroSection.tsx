// components/HeroSection.tsx — EDELMAN HERO (premium, civilised, build-safe)
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Sparkles, ShieldCheck, BookOpen, Vault, LineChart } from "lucide-react";

// --- Utility Components ------------------------------------------------------

function Eyebrow({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full",
        "border border-white/10 bg-white/[0.04] px-3 py-1",
        "text-[11px] uppercase tracking-[0.28em] font-bold",
        "text-white/70",
        className
      )}
    >
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      {children}
    </span>
  );
}

function Pill({
  children,
  className,
  icon,
}: React.PropsWithChildren<{ className?: string; icon?: React.ReactNode }>) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full",
        "border border-white/10 bg-white/[0.03] px-3 py-1",
        "text-[11px] font-semibold text-white/70",
        className
      )}
    >
      {icon ? <span className="text-amber-300/80">{icon}</span> : null}
      {children}
    </span>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.26em] text-white/45">{label}</div>
      <div className="mt-1 font-serif text-lg text-white/90">{value}</div>
    </div>
  );
}

// --- Type Definitions --------------------------------------------------------

type Cta = { href: string; label: string; ariaLabel?: string };
type VideoSource = { src: string; type: string };
type AspectRatio = "book" | "wide" | "square" | "cover-wide";

type HeroProps = {
  title?: string;
  subtitle?: string;
  eyebrow?: string;

  primaryCta?: Cta;
  secondaryCta?: Cta;

  coverImage?: string | null;
  coverAspect?: AspectRatio;
  coverFit?: "contain" | "cover";
  coverPosition?: "left" | "center" | "right" | "top";

  videoSources?: VideoSource[] | null;
  poster?: string | null;
};

// --- Utilities ---------------------------------------------------------------

function normalizeLocal(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  const cleanSrc = src.replace(/^\/+/, "");
  return `/${cleanSrc}`;
}

function getAspectClass(aspect: AspectRatio): string {
  switch (aspect) {
    case "square":
      return "h-[220px] sm:h-[260px] md:h-[300px] lg:h-[340px]";
    case "wide":
      return "h-[200px] sm:h-[230px] md:h-[260px] lg:h-[300px]";
    case "cover-wide":
      return "h-[180px] sm:h-[210px] md:h-[240px] lg:h-[280px]";
    case "book":
    default:
      return "h-[260px] sm:h-[320px] md:h-[380px] lg:h-[440px]";
  }
}

// --- Main Component ----------------------------------------------------------

export default function HeroSection({
  title = "When the System Breaks You: Finding Purpose in Pain",
  subtitle = "Win the only battle you fully control — the one inside your chest.",
  eyebrow = "Operational Briefing",

  primaryCta = {
    href: "/downloads/Fathering_Without_Fear_Teaser-Mobile.pdf",
    label: "Get the free teaser",
    ariaLabel: "Download the Fathering Without Fear Teaser PDF",
  },
  secondaryCta = { href: "/blog", label: "Read the latest insights" },

  coverImage,
  coverAspect = "book",
  coverFit = "contain",
  coverPosition = "center",

  videoSources = [],
  poster = null,
}: HeroProps) {
  const defaultImage = "/assets/images/abraham-of-london-banner.webp";
  const imgSrc = normalizeLocal(coverImage) || normalizeLocal(defaultImage)!;
  const hasVideo = Array.isArray(videoSources) && videoSources.length > 0;
  const posterSrc = normalizeLocal(poster) || imgSrc;

  const frameClasses = clsx(
    "relative overflow-hidden rounded-3xl",
    "border border-white/10 bg-white/[0.02]",
    "shadow-[0_30px_120px_rgba(0,0,0,0.55)]",
    "max-w-[560px] w-full mx-auto",
    getAspectClass(coverAspect),
    coverFit === "contain" ? "p-3 sm:p-4" : "p-0"
  );

  const mediaClasses = clsx(
    "block h-full w-full",
    coverFit === "contain" ? "object-contain" : "object-cover",
    {
      "object-left": coverPosition === "left",
      "object-right": coverPosition === "right",
      "object-top": coverPosition === "top",
      "object-center": coverPosition === "center",
    }
  );

  return (
    <section
      className={clsx(
        "relative overflow-hidden bg-black",
        // premium light bloom
        "before:pointer-events-none before:absolute before:inset-0",
        "before:bg-[radial-gradient(70%_55%_at_50%_0%,rgba(245,158,11,.18),transparent_60%)]",
        // subtle technical grid (low contrast)
        "after:pointer-events-none after:absolute after:inset-0 after:opacity-20",
        "after:bg-[radial-gradient(rgba(255,255,255,0.10)_1px,transparent_1px)] after:[background-size:18px_18px]"
      )}
      role="region"
      aria-label="Homepage hero"
    >
      {/* top edge line */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-14 md:grid-cols-2 md:gap-14 md:py-20">
        {/* LEFT: copy */}
        <div className="relative z-[1]">
          {eyebrow && <Eyebrow className="mb-5">{eyebrow}</Eyebrow>}

          <h1
            id="hero-title"
            className={clsx(
              "font-serif font-semibold leading-[1.06] text-white [text-wrap:balance]",
              "text-[clamp(2.1rem,3.6vw,3.55rem)]"
            )}
          >
            <span className="text-white/90">{title}</span>
          </h1>

          {subtitle && (
            <p className="mt-5 max-w-prose text-white/55 leading-relaxed text-[15px] sm:text-[16px]">
              {subtitle}
            </p>
          )}

          {/* credibility signals */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Pill icon={<ShieldCheck className="h-4 w-4" />}>Canon-rooted doctrine</Pill>
            <Pill icon={<LineChart className="h-4 w-4" />}>High-stakes execution</Pill>
            <Pill icon={<Vault className="h-4 w-4" />}>Artifacts in the Vault</Pill>
          </div>

          {/* mini stats (subtle social proof without “brag”) */}
          <div className="mt-7 grid grid-cols-2 gap-3 sm:max-w-[520px] sm:grid-cols-3">
            <Stat label="Canon" value="12 Volumes" />
            <Stat label="Shorts" value="76 Briefings" />
            <Stat label="Assets" value="Vault-ready" />
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {primaryCta && (
              <Link
                href={primaryCta.href}
                aria-label={primaryCta.ariaLabel || `Go to ${primaryCta.label}`}
                className={clsx(
                  "inline-flex items-center justify-center gap-2 rounded-full",
                  "bg-amber-500 px-5 py-2.5",
                  "text-[11px] font-black uppercase tracking-[0.22em] text-black",
                  "hover:bg-amber-400 transition",
                  "shadow-[0_0_38px_rgba(245,158,11,0.22)]"
                )}
              >
                {primaryCta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                aria-label={secondaryCta.ariaLabel || `Go to ${secondaryCta.label}`}
                className={clsx(
                  "inline-flex items-center justify-center gap-2 rounded-full",
                  "border border-white/12 bg-white/[0.04] px-5 py-2.5",
                  "text-[11px] font-black uppercase tracking-[0.22em] text-white/85",
                  "hover:border-white/25 hover:bg-white/[0.06] transition"
                )}
              >
                {secondaryCta.label}
              </Link>
            )}

            {/* tertiary link: Canon (quietly forces serious positioning) */}
            <Link
              href="/canon/the-architecture-of-human-purpose"
              className="ml-1 inline-flex items-center gap-2 text-xs font-semibold text-white/55 hover:text-white/80 transition"
            >
              <BookOpen className="h-4 w-4 text-amber-300/70" />
              Start with the Mini-Book
            </Link>
          </div>

          {/* micro disclaimer line (tone: serious, not salesy) */}
          <p className="mt-6 text-xs text-white/35">
            Not motivation. Not noise. <span className="text-white/55">Architecture → Logic → Deployment.</span>
          </p>
        </div>

        {/* RIGHT: media */}
        <div className="relative">
          {/* back glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-6 rounded-[2.25rem] bg-amber-500/10 blur-[55px] opacity-60"
          />

          <div className={frameClasses}>
            {/* inner bevel */}
            <div
              aria-hidden
              className={clsx(
                "pointer-events-none absolute inset-0 rounded-3xl",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]"
              )}
            />

            {/* gradient veil when cover-fit */}
            {coverFit === "cover" && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-[1]
                           bg-[linear-gradient(to_bottom,rgba(0,0,0,0.40),transparent_35%,transparent_65%,rgba(0,0,0,0.32))]"
              />
            )}

            {/* subtle “brand stamp” */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-5 top-5 z-[2] inline-flex items-center gap-2 rounded-full
                         border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70"
            >
              A•O•L
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300/70" />
              Featured
            </div>

            {/* Media: Video or Image */}
            {hasVideo ? (
              <video
                className={mediaClasses}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster={posterSrc}
                aria-describedby="hero-title"
                onContextMenu={(e) => e.preventDefault()}
              >
                {videoSources!.map((s) => (
                  <source key={s.src} src={normalizeLocal(s.src)} type={s.type} />
                ))}
              </video>
            ) : (
              <Image
                src={imgSrc}
                alt={title || "Hero image illustrating the page content"}
                width={900}
                height={1200}
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className={mediaClasses}
              />
            )}

            {/* bottom edge line */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent"
            />
          </div>
        </div>
      </div>

      {/* bottom fade */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black to-transparent" />
    </section>
  );
}