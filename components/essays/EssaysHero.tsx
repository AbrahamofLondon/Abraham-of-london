/* components/essays/EssaysHero.tsx — HERO THAT DOES NOT CROP (cinematic, premium, safe text) */
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Props = {
  title?: string;
  subtitle?: string;
  // Featured “cover” image (the big banner image you’re seeing cropped)
  coverImage?: string;
  // Optional featured article CTA
  ctaHref?: string;
  ctaLabel?: string;
  // Optional: if you want a fallback gradient when no image
  variant?: "image" | "minimal";
};

export default function EssaysHero({
  title = "Essays & Insights",
  subtitle = "Explorations in the craft of building meaningful institutions.",
  coverImage,
  ctaHref,
  ctaLabel = "Read Essay",
  variant = "image",
}: Props) {
  return (
    <section className="relative overflow-hidden bg-black">
      {/* Top spacing for fixed header */}
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12 pt-28 pb-10">
        <div className="text-center">
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight text-white/95">
            {title}
          </h1>
          <p className="mt-3 text-sm md:text-base text-white/55">
            {subtitle}
          </p>
        </div>

        {/* Banner */}
        <div className="mt-10">
          <div
            className={[
              "relative overflow-hidden rounded-3xl border border-white/10",
              "bg-white/[0.02] shadow-[0_20px_80px_rgba(0,0,0,0.55)]",
            ].join(" ")}
          >
            {/* Hard safe height to avoid “shrinking” and keep title stable */}
            <div className="relative h-[190px] sm:h-[220px] md:h-[260px] lg:h-[300px]">
              {/* Background wash */}
              <div aria-hidden className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/40" />
                <div className="absolute inset-0 aol-grain opacity-[0.06] mix-blend-soft-light" />
                <div className="absolute inset-0 aol-vignette opacity-[0.75]" />
              </div>

              {/* Image (NO CROP) */}
              {variant === "image" && coverImage ? (
                <>
                  {/* This layer keeps the whole artwork visible */}
                  <div className="absolute inset-0">
                    <Image
                      src={coverImage}
                      alt=""
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 1200px"
                      className={[
                        // ✅ Key fix: contain instead of cover so the full image is not chopped
                        "object-contain",
                        // Keep it visually centred and framed
                        "object-center",
                        // Add breathing room so the edges don’t kiss the border
                        "p-4 sm:p-5 md:p-6",
                        // Soften slightly to blend with the chamber wash
                        "opacity-[0.92]",
                      ].join(" ")}
                    />
                  </div>

                  {/* subtle highlight glows */}
                  <div aria-hidden className="absolute inset-0">
                    <div className="absolute -left-16 top-[-60px] h-72 w-72 rounded-full bg-amber-500/10 blur-[120px]" />
                    <div className="absolute right-[-40px] bottom-[-70px] h-80 w-80 rounded-full bg-white/5 blur-[140px]" />
                  </div>
                </>
              ) : (
                <div aria-hidden className="absolute inset-0">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(245,158,11,0.18),transparent_55%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_75%,rgba(255,255,255,0.06),transparent_55%)]" />
                </div>
              )}

              {/* CTA overlay (kept inside safe padding so it never pushes title aside) */}
              {ctaHref ? (
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/40">
                      Featured
                    </div>
                    <Link
                      href={ctaHref}
                      className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.3em] text-black hover:bg-amber-400 transition-colors"
                    >
                      {ctaLabel} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Bottom spacing to separate from cards list */}
          <div className="mt-10 border-b border-white/10" />
        </div>
      </div>
    </section>
  );
}