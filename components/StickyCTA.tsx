"use client";

import React from "react";
import Link from "next/link";
import clsx from "clsx";

type Props = {
  showAfter?: number;
  phoneHref?: string;
  phoneLabel?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
};

const LS_KEY = "cta:dismissed";
const CSS_VAR = "--sticky-cta-h";
const isInternal = (href = "") => href.startsWith("/") || href.startsWith("#");

export default function StickyCTA({
  showAfter = 480,
  phoneHref = "tel:+442086225909",
  phoneLabel = "Call Abraham",
  primaryHref = "/contact",
  primaryLabel = "Work With Me",
  secondaryHref = "/newsletter",
  secondaryLabel = "Subscribe",
  className,
}: Props) {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = React.useState(false);
  const [compact, setCompact] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  // read dismissal once
  React.useEffect(() => {
    try { setDismissed(localStorage.getItem(LS_KEY) === "1"); } catch {}
  }, []);

  // show/hide + compact based on scroll position
  React.useEffect(() => {
    if (dismissed) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = window.scrollY || 0;
        setVisible(y > showAfter);
        setCompact(y > showAfter + 800);
      });
    };

    onScroll(); // initial
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showAfter, dismissed]);

  // publish height into CSS var so globals.css can pad <main>
  React.useEffect(() => {
    const root = document.documentElement;
    const setVar = (px: number) => root.style.setProperty(CSS_VAR, px > 0 ? `${px}px` : "0px");

    if (!visible || dismissed) { setVar(0); return; }

    const el = wrapRef.current;
    if (!el) return;

    // initial
    setVar(el.offsetHeight);

    // react to size changes
    const ro = new ResizeObserver(() => setVar(el.offsetHeight));
    ro.observe(el);

    return () => { ro.disconnect(); setVar(0); };
  }, [visible, dismissed]);

  const doDismiss = () => {
    try { localStorage.setItem(LS_KEY, "1"); } catch {}
    setDismissed(true);
  };

  if (!visible || dismissed) return null;

  return (
    <aside
      className={clsx(
        "fixed right-4 z-[70] max-w-[92vw] sm:max-w-sm transition-all",
        compact ? "bottom-2" : "bottom-4",
        className
      )}
      role="complementary"
      aria-label="Quick contact"
    >
      <div
        ref={wrapRef}
        className={clsx(
          "relative rounded-2xl border border-forest/15 bg-white/95 shadow-card backdrop-blur",
          "dark:bg-deepCharcoal/95 dark:border-white/10",
          "transition-all",
          compact ? "px-3 py-2" : "px-4 py-3 sm:px-5 sm:py-4"
        )}
      >
        {/* Dismiss */}
        <button
          type="button"
          onClick={doDismiss}
          aria-label="Dismiss"
          className={clsx(
            "absolute -top-2 -right-2 grid h-7 w-7 place-items-center rounded-full",
            "bg-black/70 text-white shadow ring-1 ring-black/50",
            "hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black/70",
            "dark:bg-white/70 dark:text-black dark:ring-white/60 dark:hover:bg-white"
          )}
        >
          ×
        </button>

        <div className={clsx("flex items-center gap-3 sm:gap-4", compact && "gap-2")}>
          {/* Phone */}
          <a
            href={phoneHref}
            className={clsx(
              "inline-flex items-center justify-center shrink-0",
              "rounded-full border border-emerald-600/30 bg-emerald-50",
              compact ? "px-2.5 py-1.5" : "px-3 py-2",
              "hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
              "dark:bg-emerald-900/30 dark:border-emerald-400/30 dark:hover:bg-emerald-900/50"
            )}
            aria-label={phoneLabel}
          >
            <PhoneIcon />
          </a>

          <div className="min-w-0 flex-1">
            {!compact && (
              <p className="truncate text-sm font-medium text-forest dark:text-cream">
                Let’s build something enduring.
              </p>
            )}

            <div className={clsx("mt-2 flex flex-wrap gap-2", compact && "mt-0")}>
              {isInternal(primaryHref) ? (
                <Link
                  href={primaryHref}
                  prefetch={false}
                  className={clsx(
                    "inline-flex items-center rounded-full bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-500",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
                    compact ? "px-3 py-1.5 text-[13px]" : "px-3 py-1.5 text-sm font-semibold"
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
                    compact ? "px-3 py-1.5 text-[13px]" : "px-3 py-1.5 text-sm font-semibold"
                  )}
                  aria-label={primaryLabel}
                >
                  {primaryLabel}
                </a>
              )}

              {isInternal(secondaryHref) ? (
                <Link
                  href={secondaryHref}
                  prefetch={false}
                  className={clsx(
                    "inline-flex items-center rounded-full border border-forest/20 text-forest transition hover:bg-forest hover:text-cream",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 dark:text-cream dark:border-white/20 dark:hover:bg-white/10",
                    compact ? "px-3 py-1.5 text-[13px]" : "px-3 py-1.5 text-sm font-semibold"
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
                    "inline-flex items-center rounded-full border border-forest/20 text-forest transition hover:bg-forest hover:text-cream",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 dark:text-cream dark:border-white/20 dark:hover:bg-white/10",
                    compact ? "px-3 py-1.5 text-[13px]" : "px-3 py-1.5 text-sm font-semibold"
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
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" role="img" className="block" fill="currentColor">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.14a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
