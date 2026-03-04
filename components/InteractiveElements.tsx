/* components/InteractiveElements.tsx */
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { WifiOff, Wifi, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";

type TextAlign = "left" | "center" | "right";

type CTAConfig = {
  text: string;
  href: string;
  variant?: "solid" | "outline";
  external?: boolean;
};

export interface HeroBannerProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  backgroundImage?: string;
  overlayOpacity?: number;
  height?: string;
  textAlign?: TextAlign;
  ctaText?: string;
  ctaOnClick?: () => void;
  showConnectionStatus?: boolean;
  additionalCTAs?: CTAConfig[];
  children?: React.ReactNode;
}

const textAlignClasses: Record<TextAlign, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
};

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
}

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
  showConnectionStatus = false,
  additionalCTAs,
  children,
}) => {
  const [isOnline, setIsOnline] = React.useState(true);

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

  return (
    <section className="relative w-full overflow-hidden border-b border-white/10" style={{ minHeight: height }}>
      {/* Background image */}
      {backgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
          aria-hidden="true"
        />
      ) : null}

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at top, rgba(0,0,0,0.35), rgba(0,0,0,0.98))",
          opacity: overlayOpacity,
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-6xl items-center px-4 py-16 lg:py-24">
        <motion.div
          className={cn("flex w-full flex-col gap-6 text-white", textAlignClasses[textAlign])}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Eyebrow + status */}
          <div className="flex flex-wrap items-center gap-3">
            {eyebrow ? (
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-400">
                {eyebrow}
              </div>
            ) : null}

            {showConnectionStatus ? (
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
            ) : null}
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">
              {title}
            </h1>

            {subtitle ? (
              <div className="max-w-2xl text-base text-gray-200 md:text-lg">{subtitle}</div>
            ) : null}
          </div>

          {/* CTA + children */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {ctaText && ctaOnClick ? (
              <Button
                variant="primary"
                size="lg"
                onClick={ctaOnClick}
                className="gap-2 uppercase tracking-wide shadow-lg shadow-black/40"
              >
                {ctaText}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : null}

            {additionalCTAs?.length ? (
              <div className="flex flex-wrap gap-3">
                {additionalCTAs.map((cta) => {
                  const href = String(cta.href || "").trim();
                  if (!href) return null;

                  const external = Boolean(cta.external) || isExternalHref(href);
                  const variant = cta.variant === "outline" ? "secondary" : "ghost";

                  return (
                    <Button
                      key={`${cta.text}-${href}`}
                      href={href}
                      variant={variant}
                      size="md"
                      className={cn(
                        "gap-2 uppercase tracking-wide",
                        cta.variant === "outline"
                          ? "border border-amber-500/60 bg-black/20 text-amber-200 hover:bg-amber-500/10"
                          : "bg-white/10 text-white hover:bg-white/20"
                      )}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {cta.text}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  );
                })}
              </div>
            ) : null}

            {children ? <div className="w-full text-xs text-gray-200 md:w-auto">{children}</div> : null}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroBanner;