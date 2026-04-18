"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Pause,
  Play,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type ShortIntent = "diagnostic" | "intelligence" | "strategy_room";

export type ShortSignalItem = {
  id: string;
  title: string;
  eyebrow?: string;
  description: string;
  videoSrc: string;
  poster?: string;
  durationLabel?: string;
  ctaLabel: string;
  ctaHref: string;
  intent: ShortIntent;
};

type ShortsSignalRailProps = {
  items: ShortSignalItem[];
  title?: string;
  subtitle?: string;
  autoAdvanceMs?: number;
  className?: string;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function getIntentLabel(intent: ShortIntent): string {
  switch (intent) {
    case "diagnostic":
      return "Start with signal";
    case "intelligence":
      return "Go deeper";
    case "strategy_room":
      return "Escalate";
    default:
      return "Continue";
  }
}

function getIntentBadgeClasses(intent: ShortIntent): string {
  switch (intent) {
    case "diagnostic":
      return "border-amber-400/30 bg-amber-400/10 text-amber-200";
    case "intelligence":
      return "border-white/15 bg-white/[0.04] text-white/75";
    case "strategy_room":
      return "border-red-400/25 bg-red-400/10 text-red-200";
    default:
      return "border-white/15 bg-white/[0.04] text-white/75";
  }
}

export default function ShortsSignalRail({
  items,
  title = "Start with Signal",
  subtitle = "Short-form pattern interrupts that move the right people from recognition to diagnosis.",
  autoAdvanceMs = 1500,
  className,
}: ShortsSignalRailProps) {
  const safeItems = Array.isArray(items) ? items : [];
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(true);
  const [isPaused, setIsPaused] = React.useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);
  const [isInView, setIsInView] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const videoRefs = React.useRef<Array<HTMLVideoElement | null>>([]);

  const activeItem = safeItems[activeIndex] ?? null;

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting && entry.intersectionRatio >= 0.45);
      },
      { threshold: [0.25, 0.45, 0.7] }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const stopAllVideos = React.useCallback(() => {
    videoRefs.current.forEach((video) => {
      if (!video) return;
      try {
        video.pause();
      } catch {}
    });
  }, []);

  const playActiveVideo = React.useCallback(async () => {
    if (!hasMounted || !isInView || isPaused) return;
    const video = videoRefs.current[activeIndex];
    if (!video) return;

    stopAllVideos();

    try {
      video.currentTime = 0;
    } catch {}

    try {
      video.muted = isMuted;
      await video.play();
    } catch {
      // fail silently; browser autoplay policies may block
    }
  }, [activeIndex, hasMounted, isInView, isMuted, isPaused, stopAllVideos]);

  React.useEffect(() => {
    void playActiveVideo();
  }, [playActiveVideo]);

  React.useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      video.muted = isMuted;
      if (idx !== activeIndex) {
        try {
          video.pause();
        } catch {}
      }
    });
  }, [isMuted, activeIndex]);

  const goToIndex = React.useCallback(
    (nextIndex: number) => {
      if (!safeItems.length) return;
      const normalized =
        nextIndex < 0
          ? safeItems.length - 1
          : nextIndex >= safeItems.length
          ? 0
          : nextIndex;
      setActiveIndex(normalized);
    },
    [safeItems.length]
  );

  const goNext = React.useCallback(() => {
    goToIndex(activeIndex + 1);
  }, [activeIndex, goToIndex]);

  const goPrev = React.useCallback(() => {
    goToIndex(activeIndex - 1);
  }, [activeIndex, goToIndex]);

  const handleEnded = React.useCallback(() => {
    if (isPaused || safeItems.length <= 1) return;
    window.setTimeout(() => {
      goNext();
    }, autoAdvanceMs);
  }, [autoAdvanceMs, goNext, isPaused, safeItems.length]);

  if (!safeItems.length) return null;

  return (
    <section
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-[32px] border border-white/10 bg-[#07070a] p-4 shadow-[0_30px_100px_-70px_rgba(0,0,0,0.95)] md:p-6",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(245,158,11,0.10),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))]" />
        <div className="absolute inset-0 aol-grain opacity-[0.06]" />
      </div>

      <div className="relative z-10">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-amber-200/70">
              Signal Layer
            </div>
            <h2 className="mt-3 font-serif text-3xl tracking-[-0.04em] text-white md:text-4xl">
              {title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/62 md:text-base">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition hover:bg-white/[0.06] hover:text-white"
              aria-label="Previous short"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsPaused((v) => !v)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition hover:bg-white/[0.06] hover:text-white"
              aria-label={isPaused ? "Play active short" : "Pause active short"}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => setIsMuted((v) => !v)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition hover:bg-white/[0.06] hover:text-white"
              aria-label={isMuted ? "Unmute active short" : "Mute active short"}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={goNext}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition hover:bg-white/[0.06] hover:text-white"
              aria-label="Next short"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black">
              <div className="aspect-[16/9] w-full">
                {safeItems.map((item, index) => {
                  const isActive = index === activeIndex;

                  return (
                    <video
                      key={item.id}
                      ref={(node) => {
                        videoRefs.current[index] = node;
                      }}
                      className={cn(
                        "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
                        isActive ? "opacity-100" : "pointer-events-none opacity-0"
                      )}
                      src={item.videoSrc}
                      poster={item.poster}
                      muted={isMuted}
                      playsInline
                      preload={index === activeIndex ? "auto" : "metadata"}
                      onEnded={isActive ? handleEnded : undefined}
                    />
                  );
                })}
              </div>

              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.10),rgba(0,0,0,0.50))]" />

              <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                <div className="max-w-2xl">
                  <div
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.28em]",
                      getIntentBadgeClasses(activeItem?.intent ?? "diagnostic")
                    )}
                  >
                    {getIntentLabel(activeItem?.intent ?? "diagnostic")}
                  </div>

                  <h3 className="mt-4 font-serif text-2xl tracking-[-0.04em] text-white md:text-4xl">
                    {activeItem?.title}
                  </h3>

                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/72 md:text-base">
                    {activeItem?.description}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Link
                      href={activeItem?.ctaHref ?? "/diagnostics/constitutional-diagnostic"}
                      className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-200 transition hover:bg-amber-400/15"
                    >
                      <span>{activeItem?.ctaLabel ?? "Continue"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    {activeItem?.durationLabel ? (
                      <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/38">
                        {activeItem.durationLabel}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.025] p-3">
              <div className="mb-3 px-2 text-[10px] font-mono uppercase tracking-[0.34em] text-white/38">
                Signals
              </div>

              <div className="space-y-2">
                {safeItems.map((item, index) => {
                  const isActive = index === activeIndex;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goToIndex(index)}
                      className={cn(
                        "group w-full rounded-[22px] border p-4 text-left transition",
                        isActive
                          ? "border-amber-400/25 bg-amber-400/10"
                          : "border-white/8 bg-white/[0.02] hover:bg-white/[0.045]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-white/38">
                            {item.eyebrow || `Signal ${String(index + 1).padStart(2, "0")}`}
                          </div>

                          <div
                            className={cn(
                              "mt-2 text-sm font-medium leading-relaxed transition",
                              isActive ? "text-white" : "text-white/78 group-hover:text-white"
                            )}
                          >
                            {item.title}
                          </div>
                        </div>

                        <div
                          className={cn(
                            "mt-1 h-2.5 w-2.5 rounded-full transition",
                            isActive ? "bg-amber-300" : "bg-white/16"
                          )}
                        />
                      </div>

                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/52">
                        {item.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          {safeItems.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goToIndex(index)}
                aria-label={`Go to short ${index + 1}`}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  isActive ? "w-8 bg-amber-300" : "w-2 bg-white/20 hover:bg-white/40"
                )}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}