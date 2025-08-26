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

const isInternal = (href = "") => href.startsWith("/") || href.startsWith("#");
const STORAGE_KEY = "cta:dismissed";

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
  const hostRef = React.useRef<HTMLDivElement | null>(null);

  const [visible, setVisible] = React.useState(false);
  const [compact, setCompact] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  // read persisted dismissal once
  React.useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {}
  }, []);

  // show/hide based on scroll position
  React.useEffect(() => {
    if (dismissed) return;

    let ticking = false;
    let lastY = 0;

    const update = () => {
      ticking = false;
      const y = typeof window !== "undefined" ? window.scrollY : 0;

      // visibility threshold
      const nowVisible = y > showAfter;
      setVisible(nowVisible);

      // compact when scrolling down a bit; expand when up
      const goingDown = y > lastY + 10;
      const goingUp = y < lastY - 10;

      if (y < showAfter + 40) setCompact(false);
      else if (goingDown) setCompact(true);
      else if (goingUp) setCompact(false);

      lastY = y;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showAfter, dismissed]);

  // publish height to a CSS var so pages can reserve space (optional)
  React.useEffect(() => {
    const el = hostRef.current;
    const setH = () => {
      const h = el && visible && !dismissed ? Math.ceil(el.getBoundingClientRect().height) : 0;
      document.documentElement.style.setProperty("--sticky-cta-h", `${h}px`);
    };
    setH();
    if (!el) return;

    const ro = new ResizeObserver(setH);
    ro.observe(el);
    window.addEventListener("resize", setH);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", setH);
      document.documentElement.style.setProperty("--sticky-cta-h", "0px");
    };
  }, [visible, compact, dismissed]);

  const handleDismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setDismissed(true);
  };

  if (!visible || dismissed) return null;

  return (
    <aside
      ref={hostRef}
      className={clsx(
        "fixed bottom-4 right-4 z-[70] max-w-[92vw] sm:max-w-sm",
        className,
      )}
      role="complementary"
      aria-label="Quick contact"
    >
      <div
        className={clsx(
          "relative pointer-events-auto border bg-white/95 backdrop-blur shadow-card ring-1 ring-black/5 dark:bg-deepCharcoal/95 dark:ring-white/10",
          "transition-all duration-300 ease-out",
          compact ? "rounded-full px-4 py-2" : "rounded-2xl px-4 py-3 sm:px-5 sm:py-4"
        )}
        onClick={() => compact && setCompact(false)} // tap pill to expand
      >
        {/* Dismiss (×) */}
        {!compact && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className={clsx(
              "absolute -top-2 -right-2 grid h-7 w-7 place-items-center rounded-full",
              "bg-white/95 text-deepCharcoal/80 shadow ring-1 ring-black/5 hover:bg-white"
            )}
          >
            ×
          </button>
        )}

        {/* COMPACT PILL */}
        {compact ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-deepCharcoal dark:text-cream">
              {primaryLabel}
            </span>
            {isInternal(primaryHref) ? (
              <Link
                href={primaryHref}
                prefetch={false}
                className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:brightness-95"
                aria-label={primaryLabel}
              >
                Go
              </Link>
            ) : (
              <a
                href={primaryHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:brightness-95"
                aria-label={primaryLabel}
              >
                Go
              </a>
            )}
          </div>
        ) : (
          /* FULL CARD */
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href={phoneHref}
              className={clsx(
                "inline-flex items-center justify-center shrink-0",
                "rounded-full border border-emerald-600/30 bg-emerald-50 px-3 py-2",
                "hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
                "dark:bg-emerald-900/30 dark:border-emerald-400/30 dark:hover:bg-emerald-900/50",
              )}
              aria-label={phoneLabel}
            >
              <PhoneIcon />
            </a>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-forest dark:text-cream">
                Let’s build something enduring.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {isInternal(primaryHref) ? (
                  <Link
                    href={primaryHref}
                    prefetch={false}
                    className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
                    aria-label={primaryLabel}
                  >
                    {primaryLabel}
                  </Link>
                ) : (
                  <a
                    href={primaryHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
                    aria-label={primaryLabel}
                  >
                    {primaryLabel}
                  </a>
                )}

                {isInternal(secondaryHref) ? (
                  <Link
                    href={secondaryHref}
                    prefetch={false}
                    className="inline-flex items-center rounded-full border border-forest/20 px-3 py-1.5 text-sm font-semibold text-forest transition hover:bg-forest hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 dark:text-cream dark:border-white/20 dark:hover:bg-white/10"
                    aria-label={secondaryLabel}
                  >
                    {secondaryLabel}
                  </Link>
                ) : (
                  <a
                    href={secondaryHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-full border border-forest/20 px-3 py-1.5 text-sm font-semibold text-forest transition hover:bg-forest hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 dark:text-cream dark:border-white/20 dark:hover:bg-white/10"
                    aria-label={secondaryLabel}
                  >
                    {secondaryLabel}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      role="img"
      className="block"
      fill="currentColor"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.14a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
