// components/reporting/boardroom/BoardroomModeSurface.tsx
// Rehomed from components/admin/reporting/boardroom-mode.tsx — now user-facing.
"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Minimize2,
  Shield,
  FileText,
  LayoutGrid,
} from "lucide-react";

type BoardroomSlide = {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  render: React.ReactNode;
};

export interface BoardroomModeProps {
  slides: BoardroomSlide[];
  title?: string;
  classification?: string;
  generatedAt?: string;
  allowFullscreen?: boolean;
  initialSlideId?: string;
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function BoardroomModeSurface({
  slides,
  title = "Executive Reporting Boardroom Briefing",
  classification = "RESTRICTED",
  generatedAt,
  allowFullscreen = true,
  initialSlideId,
}: BoardroomModeProps) {
  const safeSlides = Array.isArray(slides) ? slides.filter(Boolean) : [];
  const initialIndex = React.useMemo(() => {
    if (!safeSlides.length) return 0;
    if (!initialSlideId) return 0;
    const found = safeSlides.findIndex((x) => x.id === initialSlideId);
    return found >= 0 ? found : 0;
  }, [safeSlides, initialSlideId]);

  const [activeIndex, setActiveIndex] = React.useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const activeSlide = safeSlides[activeIndex];

  const goPrev = React.useCallback(() => {
    setActiveIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goNext = React.useCallback(() => {
    setActiveIndex((prev) => Math.min(safeSlides.length - 1, prev + 1));
  }, [safeSlides.length]);

  const toggleFullscreen = React.useCallback(async () => {
    if (!allowFullscreen) return;

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
  }, [allowFullscreen]);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "Escape" && document.fullscreenElement) {
        void document.exitFullscreen();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [goNext, goPrev]);

  if (!safeSlides.length || !activeSlide) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-[#0A0C10] p-8 text-white">
        <div className="flex items-center gap-2 text-white/60">
          <LayoutGrid className="h-4 w-4" />
          <span className="text-sm">No boardroom slides available.</span>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[32px] border border-white/10 bg-[#07090D] text-white shadow-[0_32px_90px_rgba(0,0,0,0.45)]",
        isFullscreen && "rounded-none border-0 shadow-none",
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,169,106,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.03),transparent_24%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A96A]/30 to-transparent" />

      <div className="relative z-10">
        <header className="flex flex-col gap-5 border-b border-white/10 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.22em] text-[#C9A96A]/80">
              <Shield className="h-3.5 w-3.5" />
              Boardroom Mode
            </div>
            <h2 className="mt-3 truncate font-serif text-2xl text-white/95 md:text-3xl">
              {title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/45">
              <span>{classification}</span>
              <span>•</span>
              <span>
                {generatedAt
                  ? new Date(generatedAt).toLocaleString()
                  : new Date().toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/55">
              <FileText className="h-3.5 w-3.5" />
              Slide {activeIndex + 1} / {safeSlides.length}
            </div>

            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04]">
              <button
                type="button"
                onClick={goPrev}
                disabled={activeIndex === 0}
                className="px-3 py-2 text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:text-white/20"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="h-6 w-px bg-white/10" />

              <button
                type="button"
                onClick={goNext}
                disabled={activeIndex >= safeSlides.length - 1}
                className="px-3 py-2 text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:text-white/20"
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {allowFullscreen ? (
              <button
                type="button"
                onClick={toggleFullscreen}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/65 transition hover:bg-white/[0.06] hover:text-white"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Expand className="h-3.5 w-3.5" />
                )}
                {isFullscreen ? "Exit" : "Fullscreen"}
              </button>
            ) : null}
          </div>
        </header>

        <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
          <aside className="border-b border-white/10 bg-black/20 p-4 lg:border-b-0 lg:border-r">
            <div className="mb-4 text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">
              Slide Index
            </div>

            <div className="space-y-2">
              {safeSlides.map((slide, index) => {
                const active = index === activeIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-left transition",
                      active
                        ? "border-[#C9A96A]/30 bg-[#C9A96A]/10"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]",
                    )}
                  >
                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="mt-2 text-sm font-medium text-white/90">
                      {slide.title}
                    </div>
                    {slide.subtitle ? (
                      <div className="mt-1 text-xs leading-5 text-white/50">
                        {slide.subtitle}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="min-h-[540px] px-6 py-6 md:px-8 md:py-8">
            <div className="mb-8">
              {activeSlide.eyebrow ? (
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#C9A96A]/80">
                  {activeSlide.eyebrow}
                </div>
              ) : null}

              <h3 className="mt-3 font-serif text-3xl text-white/95 md:text-4xl">
                {activeSlide.title}
              </h3>

              {activeSlide.subtitle ? (
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60 md:text-base">
                  {activeSlide.subtitle}
                </p>
              ) : null}
            </div>

            <div>{activeSlide.render}</div>
          </main>
        </div>

        <footer className="flex items-center justify-between border-t border-white/10 px-6 py-4 text-[10px] font-mono uppercase tracking-[0.18em] text-white/30 md:px-8">
          <span>Live boardroom surface</span>
          <span>{new Date().toISOString().replace("T", " ").slice(0, 19)} UTC</span>
        </footer>
      </div>
    </section>
  );
}
