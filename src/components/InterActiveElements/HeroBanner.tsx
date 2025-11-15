// src/components/InterActiveElements/HeroBanner.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useWebSocketStatus } from "@/lib/websocket-service";

export type TextAlign = "left" | "center" | "right";

export interface HeroBannerProps {
  title: string;
  subtitle?: string;
  backgroundImage: string;
  overlayOpacity?: number;
  height?: string;
  textAlign?: TextAlign;
  ctaText?: string;
  ctaOnClick?: () => void;
  children?: React.ReactNode;
  showConnectionStatus?: boolean;
  eyebrow?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  title,
  subtitle,
  backgroundImage,
  overlayOpacity = 0.5,
  height = "80vh",
  textAlign = "center",
  ctaText,
  ctaOnClick,
  children,
  showConnectionStatus = false,
  eyebrow,
}) => {
  const connected = showConnectionStatus ? useWebSocketStatus() : null;

  const alignmentClasses: Record<TextAlign, string> = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  };

  return (
    <section
      className="relative flex w-full items-stretch justify-center overflow-hidden"
      style={{ height }}
    >
      {/* Background layer */}
      <div className="absolute inset-0">
        <div
          className="h-full w-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
        />
      </div>

      {/* Foreground content */}
      <div className="relative z-10 flex h-full w-full max-w-6xl px-4 py-10 md:px-8 lg:px-10">
        <motion.div
          className={`flex w-full flex-col justify-center gap-4 ${alignmentClasses[textAlign]}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Eyebrow + connection */}
          <div className="mb-1 flex w-full flex-wrap items-center gap-4">
            {eyebrow && (
              <p className="text-xs uppercase tracking-[0.35em] text-softGold/80">
                {eyebrow}
              </p>
            )}

            {showConnectionStatus && connected !== null && (
              <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[11px] text-gray-200 ring-1 ring-white/10">
                <span
                  className={`h-2 w-2 rounded-full ${
                    connected ? "bg-green-400" : "bg-red-500"
                  }`}
                />
                <span className="uppercase tracking-[0.15em]">
                  {connected ? "Live link active" : "Offline mode"}
                </span>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="font-serif text-4xl font-semibold leading-tight text-white md:text-5xl lg:text-6xl">
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p className="max-w-2xl text-base leading-relaxed text-gray-200 md:text-lg">
              {subtitle}
            </p>
          )}

          {/* CTA + children */}
          {(ctaText || children) && (
            <div className="mt-4 flex flex-col gap-4">
              {ctaText && (
                <button
                  type="button"
                  onClick={ctaOnClick}
                  className="inline-flex w-fit items-center rounded-full bg-softGold px-6 py-3 text-sm font-semibold uppercase tracking-wide text-deepCharcoal shadow-lg shadow-softGold/30 transition-all hover:bg-softGold/90 hover:shadow-softGold/50 focus:outline-none focus:ring-2 focus:ring-softGold focus:ring-offset-2 focus:ring-offset-black"
                >
                  {ctaText}
                </button>
              )}
              {children && <div className="max-w-3xl">{children}</div>}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroBanner;