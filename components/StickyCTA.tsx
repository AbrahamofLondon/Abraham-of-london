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

const STORAGE_KEY = "cta:dismissed";
const isInternal = (href = "") => href.startsWith("/") || href.startsWith("#");

// Match your layout container (max-w-7xl = 1280px) and a safe edge pad
const CONTENT_PX = 1280;
const PAD = 16;

// Docked card target width
const CARD_W = 360;

// FAB dimensions
const FAB_SIZE = 56;
const FAB_PAD = 10;

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
  const shellRef = React.useRef<HTMLDivElement | null>(null);

  const [visible, setVisible] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [mode, setMode] = React.useState<"dock" | "fab">("dock");

  // read persisted dismissal
  React.useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {}
  }, []);

  // Reserve space for the docked card only (so it never overlays content)
  const publishHeight = React.useCallback(() => {
    if (!shellRef.current) return;
    const h = Math.ceil(shellRef.current.getBoundingClientRect().height) + 16;
    document.documentElement.style.setProperty("--sticky-cta-h", `${h}px`);
  }, []);

  // Dock if the right gutter can fit 360px; else use tiny FAB
  const recomputeMode = React.useCallback(() => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 0;
    const sideGutter = Math.max(0, (vw - CONTENT_PX) / 2);
    const available = Math.max(0, sideGutter - PAD);
    setMode(available >= CARD_W ? "dock" : "fab");
  }, []);

  // show/hide + collapse on scroll
  React.useEffect(() => {
    let lastY = 0,
      ticking = false;
    const onScroll = () => {
      const y = window.scrollY || 0;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setVisible(y > showAfter);
        setCollapsed(y > showAfter && y - lastY > 6);
        lastY = y;
        ticking = false;
      });
    };
    recomputeMode();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", recomputeMode);
    window.addEventListener("orientationchange", recomputeMode);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", recomputeMode);
      window.removeEventListener("orientationchange", recomputeMode);
    };
  }, [showAfter, recomputeMode]);

  // Keep the reserved space synced (only for docked mode)
  React.useEffect(() => {
    if (!visible || mode !== "dock") {
      document.documentElement.style.setProperty("--sticky-cta-h", "0px");
      return;
    }
    publishHeight();
  }, [visible, collapsed, mode, publishHeight]);

  // Cleanup var on unmount
  React.useEffect(
    () => () => {
      document.documentElement.style.setProperty("--sticky-cta-h", "0px");
    },
    []
  );

  const onDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setDismissed(true);
    document.documentElement.style.setProperty("--sticky-cta-h", "0px");
  };

  if (dismissed || !visible) return null;

  return mode === "dock" ? (
    <aside
      role="complementary"
      aria-label="Quick contact"
      className={clsx("fixed bottom-4 z-[70] transition-[transform,opacity] duration-200", className)}
      style={{ right: PAD, left: "auto", width: CARD_W }}
      ref={shellRef}
      data-mode="dock"
    >
      <DockedCard
        collapsed={collapsed}
        phoneHref={phoneHref}
        phoneLabel={phoneLabel}
        primaryHref={primaryHref}
        primaryLabel={primaryLabel}
        secondaryHref={secondaryHref}
        secondaryLabel={secondaryLabel}
        onDismiss={onDismiss}
      />
    </aside>
  ) : (
    <aside
      role="complementary"
      aria-label="Quick contact"
      className={clsx("fixed bottom-4 right-4 z-[70]", className)}
      ref={shellRef}
      data-mode="fab"
      style={{ right: PAD }}
    >
      <div
        className="relative rounded-full bg-white/95 shadow-card backdrop-blur dark:bg-deepCharcoal/95"
        style={{ padding: FAB_PAD }}
      >
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          title="Dismiss"
          className="absolute -right-2 -top-2 rounded-full bg-black/70 px-1 text-[11px] leading-none text-white hover:bg-black/80 dark:bg-white/20 dark:hover:bg-white/30"
        >
          ×
        </button>

        {isInternal(primaryHref) ? (
          <Link
            href={primaryHref}
            prefetch={false}
            aria-label={primaryLabel}
            title={primaryLabel}
            className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-emerald-600 text-white shadow transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
          >
            <PhoneArrowIcon />
          </Link>
        ) : (
          <a
            href={primaryHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={primaryLabel}
            title={primaryLabel}
            className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-emerald-600 text-white shadow transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
          >
            <PhoneArrowIcon />
          </a>
        )}
      </div>
    </aside>
  );
}

/* ----------------- presentational: full card (docked) ----------------- */
type DockedProps = {
  collapsed: boolean;
  phoneHref: string;
  phoneLabel: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  onDismiss: () => void;
};

const DockedCard = React.forwardRef<HTMLDivElement, DockedProps>(function DockedCard(
  { collapsed, phoneHref, phoneLabel, primaryHref, primaryLabel, secondaryHref, secondaryLabel, onDismiss },
  ref
) {
  return (
    <div
      ref={ref}
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-forest/15 bg-white/95 shadow-card backdrop-blur",
        "px-4 py-3 sm:px-5 sm:py-4 dark:bg-deepCharcoal/95 dark:border-white/10",
        collapsed && "px-3 py-2 sm:px-3 sm:py-2"
      )}
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        title="Dismiss"
        className={clsx("absolute right-2 top-2 rounded-md p-1 text-deepCharcoal/60 hover:bg-black/5", "dark:text-cream/70 dark:hover:bg-white/10")}
      >
        <span aria-hidden>×</span>
      </button>

      <div className={clsx("flex items-center gap-3 sm:gap-4", collapsed && "gap-2")}>
        <a
          href={phoneHref}
          aria-label={phoneLabel}
          title={phoneLabel}
          className={clsx(
            "inline-flex shrink-0 items-center justify-center rounded-full border border-emerald-600/30 bg-emerald-50 px-3 py-2",
            "hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
            "dark:bg-emerald-900/30 dark:border-emerald-400/30 dark:hover:bg-emerald-900/50"
          )}
        >
          <PhoneIcon />
        </a>

        <div className="min-w-0 flex-1">
          {!collapsed && <p className="truncate text-sm font-medium text-forest dark:text-cream">Let’s build something enduring.</p>}

          <div className={clsx("mt-2 flex flex-wrap gap-2", collapsed && "mt-0")}>
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

            {!collapsed &&
              (isInternal(secondaryHref) ? (
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
  );
});

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false" role="img" className="block" fill="currentColor">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.14a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function PhoneArrowIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false" role="img" fill="currentColor">
      <path d="M3 12a7 7 0 0 1 7-7h4a7 7 0 1 1 0 14H9l-4 4v-4a7 7 0 0 1-2-7z" />
    </svg>
  );
}
