"use client";

import React from "react";
import Link from "next/link";
import clsx from "clsx";

type Props = {
  showAfter?: number;             // px scrolled before it appears
  phoneHref?: string;
  phoneLabel?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
};

const STORAGE_KEY = "cta:dismissed";
const isInternal = (href = "") => href.startsWith("/") || href.startsWith("#");
const MAX_CONTENT_PX = 1280;      // Tailwind max-w-7xl (80rem)

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
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [pos, setPos] = React.useState<{ left: number | "auto"; right: number | "auto" }>({
    left: 16,
    right: 16,
  });

  // read persisted dismissal
  React.useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {}
  }, []);

  // publish height → CSS var so <main> reserves space
  const publishHeight = React.useCallback(() => {
    if (!ref.current) return;
    const h = ref.current.getBoundingClientRect().height;
    // add 16px breathing room
    document.documentElement.style.setProperty("--sticky-cta-h", `${h + 16}px`);
  }, []);

  // compute desktop gutter position (keeps it out of the grid)
  const computePosition = React.useCallback(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 0;
    if (w < 768) {
      // mobile: full-width-ish
      setPos({ left: 16, right: 16 });
    } else {
      // desktop: right gutter: max(16px, (vw - content)/2 + 16px)
      const gutter = Math.max(16, (w - MAX_CONTENT_PX) / 2 + 16);
      setPos({ left: "auto", right: Math.floor(gutter) });
    }
  }, []);

  // show/hide + shrink on scroll
  React.useEffect(() => {
    let lastY = 0;
    let ticking = false;

    const onScroll = () => {
      const y = window.scrollY || 0;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setVisible(y > showAfter);
          // collapse when scrolling down, expand when scrolling up
          setCollapsed(y > showAfter && y - lastY > 6);
          lastY = y;
          ticking = false;
        });
        ticking = true;
      }
    };

    // init states
    computePosition();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", computePosition);
    window.addEventListener("orientationchange", computePosition);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", computePosition);
      window.removeEventListener("orientationchange", computePosition);
    };
  }, [showAfter, computePosition]);

  // update css var on (un)collapse/resize
  React.useEffect(() => {
    publishHeight();
  }, [collapsed, visible, publishHeight]);

  // cleanup css var on unmount
  React.useEffect(() => {
    return () => {
      document.documentElement.style.setProperty("--sticky-cta-h", "0px");
    };
  }, []);

  const onDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setDismissed(true);
    // remove reserved space immediately
    document.documentElement.style.setProperty("--sticky-cta-h", "0px");
  };

  if (dismissed || !visible) return null;

  return (
    <aside
      role="complementary"
      aria-label="Quick contact"
      className={clsx(
        "fixed bottom-4 z-[70] max-w-[92vw] sm:max-w-sm",
        // smooth shrink/expand
        "transition-[transform,opacity] duration-200",
        className
      )}
      style={{ right: pos.right as number | undefined, left: pos.left as number | undefined }}
    >
      <div
        ref={ref}
        className={clsx(
          "relative overflow-hidden rounded-2xl border border-forest/15 bg-white/95 shadow-card backdrop-blur",
          "px-4 py-3 sm:px-5 sm:py-4 dark:bg-deepCharcoal/95 dark:border-white/10",
          collapsed && "px-3 py-2 sm:px-3 sm:py-2"
        )}
      >
        {/* dismiss */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className={clsx(
            "absolute right-2 top-2 rounded-md p-1 text-deepCharcoal/60 hover:bg-black/5",
            "dark:text-cream/70 dark:hover:bg-white/10"
          )}
        >
          <span aria-hidden>×</span>
        </button>

        <div className={clsx("flex items-center gap-3 sm:gap-4", collapsed && "gap-2")}>
          {/* phone */}
          <a
            href={phoneHref}
            className={clsx(
              "inline-flex shrink-0 items-center justify-center rounded-full border border-emerald-600/30 bg-emerald-50 px-3 py-2",
              "hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
              "dark:bg-emerald-900/30 dark:border-emerald-400/30 dark:hover:bg-emerald-900/50"
            )}
            aria-label={phoneLabel}
          >
            <PhoneIcon />
          </a>

          {/* text + buttons (hide tagline when collapsed) */}
          <div className="min-w-0 flex-1">
            {!collapsed && (
              <p className="truncate text-sm font-medium text-forest dark:text-cream">
                Let’s build something enduring.
              </p>
            )}

            <div className={clsx("mt-2 flex flex-wrap gap-2", collapsed && "mt-0")}>
              {/* Primary */}
              {isInternal(primaryHref) ? (
                <Link
                  href={primaryHref}
                  prefetch={false}
                  className={clsx(
                    "inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white",
                    "shadow-sm transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
                    collapsed && "px-3 py-1 text-[13px]"
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
                    "inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white",
                    "shadow-sm transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
                    collapsed && "px-3 py-1 text-[13px]"
                  )}
                  aria-label={primaryLabel}
                >
                  {primaryLabel}
                </a>
              )}

              {/* Secondary — hide label when collapsed (keeps a tidy pill) */}
              {!collapsed && (isInternal(secondaryHref) ? (
                <Link
                  href={secondaryHref}
                  prefetch={false}
                  className={clsx(
                    "inline-flex items-center rounded-full border border-forest/20 px-3 py-1.5 text-sm font-semibold text-forest",
                    "transition hover:bg-forest hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/30",
                    "dark:text-cream dark:border-white/20 dark:hover:bg-white/10"
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
                    "inline-flex items-center rounded-full border border-forest/20 px-3 py-1.5 text-sm font-semibold text-forest",
                    "transition hover:bg-forest hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/30",
                    "dark:text-cream dark:border-white/20 dark:hover:bg-white/10"
                  )}
                  aria-label={secondaryLabel}
                >
                  {secondaryLabel}
                </a>
              ))}
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
