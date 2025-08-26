"use client";

import React from "react";
import Link from "next/link";
import clsx from "clsx";

type Props = {
  showAfter?: number;          // px scrolled before we show
  compactDelta?: number;       // extra px after showAfter to compact
  phoneHref?: string;
  phoneLabel?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
};

const isInternal = (href = "") => href.startsWith("/") || href.startsWith("#");
const CSS_VAR = "--sticky-cta-h";
const LS_KEY  = "cta:dismissed";

export default function StickyCTA({
  showAfter = 480,
  compactDelta = 240,
  phoneHref = "tel:+442086225909",
  phoneLabel = "Call Abraham",
  primaryHref = "/contact",
  primaryLabel = "Work With Me",
  secondaryHref = "/newsletter",
  secondaryLabel = "Subscribe",
  className,
}: Props) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [dismissed, setDismissed] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [compact, setCompact] = React.useState(false);

  // read dismissal once
  React.useEffect(() => {
    try { setDismissed(localStorage.getItem(LS_KEY) === "1"); } catch {}
  }, []);

  // publish height (or 0 if hidden/dismissed)
  const publishHeight = React.useCallback(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (!visible || dismissed || !ref.current) {
      root.style.setProperty(CSS_VAR, "0px");
      return;
    }
    const h = Math.ceil(ref.current.getBoundingClientRect().height);
    root.style.setProperty(CSS_VAR, `${h}px`);
  }, [visible, dismissed]);

  // keep height in sync
  React.useEffect(() => {
    publishHeight();
    if (!ref.current) return;
    const ro = new ResizeObserver(publishHeight);
    ro.observe(ref.current);
    window.addEventListener("resize", publishHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", publishHeight);
    };
  }, [publishHeight]);

  // visibility + compact logic
  React.useEffect(() => {
    let lastY = window.scrollY || 0;
    let ticking = false;

    const tick = () => {
      ticking = false;
      const y = window.scrollY || 0;
      const goingDown = y > lastY + 4;

      const nextVisible = !dismissed && y > showAfter;
      const nextCompact = nextVisible && y > showAfter + compactDelta && goingDown;

      if (nextVisible !== visible) setVisible(nextVisible);
      if (nextCompact !== compact) setCompact(nextCompact);

      lastY = y;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(tick);
      }
    };

    tick(); // initial
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed, showAfter, compactDelta, visible, compact]);

  // republish height whenever state changes
  React.useEffect(() => { publishHeight(); }, [visible, compact, dismissed, publishHeight]);

  const handleDismiss = React.useCallback(() => {
    try { localStorage.setItem(LS_KEY, "1"); } catch {}
    setDismissed(true);
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty(CSS_VAR, "0px");
    }
  }, []);

  if (dismissed || !visible) return null;

  return (
    <aside
      ref={ref as any}
      className={clsx(
        "fixed right-4 z-[70] max-w-[92vw] sm:max-w-sm",
        "bottom-[calc(16px+env(safe-area-inset-bottom,0px))]", // keep off OS bar
        className
      )}
      role="complementary"
      aria-label="Quick contact"
      onMouseEnter={() => setCompact(false)}
      onFocusCapture={() => setCompact(false)}
    >
      <div
        className={clsx(
          "relative overflow-hidden rounded-2xl border border-forest/15 bg-white/95 shadow-card backdrop-blur",
          "dark:bg-deepCharcoal/95 dark:border-white/10",
          compact ? "px-3 py-2" : "px-4 py-3 sm:px-5 sm:py-4"
        )}
      >
        {/* dismiss */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className={clsx(
            "absolute top-1.5 right-1.5 rounded-md p-1 text-deepCharcoal/60 hover:bg-black/5 hover:text-deepCharcoal",
            "dark:text-cream/70 dark:hover:bg-white/10 dark:hover:text-cream",
            compact && "opacity-80"
          )}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Phone circle */}
          <a
            href={phoneHref}
            className={clsx(
              "inline-flex shrink-0 items-center justify-center",
              "rounded-full border border-emerald-600/30 bg-emerald-50",
              "hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
              "dark:bg-emerald-900/30 dark:border-emerald-400/30 dark:hover:bg-emerald-900/50",
              compact ? "px-2.5 py-1.5" : "px-3 py-2"
            )}
            aria-label={phoneLabel}
            title={phoneLabel}
          >
            <PhoneIcon />
          </a>

          {/* text + buttons */}
          <div className="min-w-0 flex-1">
            {!compact && (
              <p className="truncate text-sm font-medium text-forest dark:text-cream">
                Let’s build something enduring.
              </p>
            )}

            <div className={clsx("mt-1.5 flex flex-wrap gap-2", compact && "mt-0")}>
              {/* Primary */}
              {isInternal(primaryHref) ? (
                <Link
                  href={primaryHref}
                  prefetch={false}
                  className={clsx(
                    "inline-flex items-center rounded-full bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-500",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
                    compact ? "px-3 py-1 text-sm" : "px-3 py-1.5 text-sm font-semibold"
                  )}
                  aria-label={primaryLabel}
                >
                  {primaryLabel}
                </Link>
              ) : (
                <a
                  href={primaryHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clsx(
                    "inline-flex items-center rounded-full bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-500",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
                    compact ? "px-3 py-1 text-sm" : "px-3 py-1.5 text-sm font-semibold"
                  )}
                  aria-label={primaryLabel}
                >
                  {primaryLabel}
                </a>
              )}

              {/* Secondary */}
              {isInternal(secondaryHref) ? (
                <Link
                  href={secondaryHref}
                  prefetch={false}
                  className={clsx(
                    "inline-flex items-center rounded-full border border-forest/20 text-forest transition",
                    "hover:bg-forest hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/30",
                    "dark:text-cream dark:border-white/20 dark:hover:bg-white/10",
                    compact ? "px-3 py-1 text-sm" : "px-3 py-1.5 text-sm font-semibold"
                  )}
                  aria-label={secondaryLabel}
                >
                  {secondaryLabel}
                </Link>
              ) : (
                <a
                  href={secondaryHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clsx(
                    "inline-flex items-center rounded-full border border-forest/20 text-forest transition",
                    "hover:bg-forest hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/30",
                    "dark:text-cream dark:border-white/20 dark:hover:bg-white/10",
                    compact ? "px-3 py-1 text-sm" : "px-3 py-1.5 text-sm font-semibold"
                  )}
                  aria-label={secondaryLabel}
                >
                  {secondaryLabel}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="20" height="20" viewBox="0 0 24 24"
      aria-hidden="true" focusable="false" role="img"
      className="block" fill="currentColor"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.14a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
