// components/InteractiveElements.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

type TextAlign = "left" | "center" | "right";

type HeroBannerCTA = {
  text: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
};

export interface HeroBannerProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  backgroundImage?: string;
  overlayOpacity?: number;
  height?: string;
  textAlign?: TextAlign;

  // Primary CTA
  ctaText?: React.ReactNode;
  ctaOnClick?: () => void;
  ctaHref?: string;

  // Extra CTAs
  additionalCTAs?: HeroBannerCTA[];

  // Online/offline badge
  showConnectionStatus?: boolean;

  children?: React.ReactNode;
}

const textAlignClasses: Record<TextAlign, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
};

export const HeroBanner: React.FC<HeroBannerProps> = ({
  title,
  subtitle,
  eyebrow,
  backgroundImage,
  overlayOpacity = 0.6,
  height = "85vh",
  textAlign = "left",
  ctaText,
  ctaOnClick,
  ctaHref,
  additionalCTAs = [],
  showConnectionStatus = false,
  children,
}) => {
  const [isOnline, setIsOnline] = React.useState<boolean>(true);

  // Simple client-side online/offline indicator
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const hasPrimaryCTA = Boolean(ctaText && (ctaOnClick || ctaHref));

  const renderCTA = (cta: HeroBannerCTA, key: React.Key) => {
    const variant = cta.variant ?? "primary";

    const base =
      "inline-flex items-center justify-center rounded-full px-6 py-3 text-xs md:text-sm font-semibold uppercase tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black";
    const byVariant: Record<NonNullable<HeroBannerCTA["variant"]>, string> = {
      primary:
        "bg-softGold text-slate-950 shadow-lg shadow-black/40 hover:bg-softGold/90 focus:ring-softGold",
      secondary:
        "bg-white/10 text-white border border-white/30 hover:bg-white/20 focus:ring-white/70",
      outline:
        "border border-softGold/70 text-softGold hover:bg-softGold/10 focus:ring-softGold/80",
    };

    const className = cn(base, byVariant[variant]);

    if (cta.href) {
      return (
        <a
          key={key}
          href={cta.href}
          className={className}
        >
          {cta.text}
        </a>
      );
    }

    return (
      <button
        key={key}
        type="button"
        onClick={cta.onClick}
        className={className}
      >
        {cta.text}
      </button>
    );
  };

  const primaryCTA: HeroBannerCTA | null = hasPrimaryCTA
    ? {
        text: ctaText as React.ReactNode,
        href: ctaHref,
        onClick: ctaOnClick,
        variant: "primary",
      }
    : null;

  return (
    <section
      className="relative w-full overflow-hidden border-b border-white/10"
      style={{ minHeight: height }}
    >
      {/* Background image */}
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
          aria-hidden="true"
        />
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top, rgba(0,0,0,0.3), rgba(0,0,0,0.95))",
          opacity: overlayOpacity,
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-6xl items-center px-4 py-16 lg:py-24">
        <motion.div
          className={cn(
            "flex w-full flex-col gap-6 text-white",
            textAlignClasses[textAlign],
          )}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Eyebrow + status */}
          <div className="flex flex-wrap items-center gap-3">
            {eyebrow && (
              <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-softGold">
                {eyebrow}
              </span>
            )}

            {showConnectionStatus && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] font-medium text-gray-200">
                {isOnline ? (
                  <>
                    <Wifi className="h-3 w-3 text-emerald-400" />
                    <span>Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-red-400" />
                    <span>Offline (content still available)</span>
                  </>
                )}
              </span>
            )}
          </div>

          {/* Title & subtitle */}
          <div className="space-y-4">
            <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">
              {title}
            </h1>
            {subtitle && (
              <p className="max-w-2xl text-base text-gray-200 md:text-lg">
                {subtitle}
              </p>
            )}
          </div>

          {/* CTAs + children */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {primaryCTA && renderCTA(primaryCTA, "primary")}

            {additionalCTAs.map((cta, index) =>
              renderCTA(cta, `extra-${index}`),
            )}

            {children && (
              <div className="w-full text-xs text-gray-200 md:w-auto">
                {children}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroBanner;