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

// Align with Layout/container
const CONTENT_PX = 1280;   // max-w-7xl
const GUTTER_PX  = 16;

// Panel sizing
const MIN_PANEL  = 300;
const MAX_PANEL  = 360;

// FAB sizing
const FAB_SIZE   = 56;
const FAB_PAD    = 10;

type Mode = "dock" | "bar" | "fab";

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

  const [mode, setMode] = React.useState<Mode>("dock");
  const [panelW, setPanelW] = React.useState<number>(MIN_PANEL);
  const [pos, setPos] = React.useState<{ left: number | "auto"; right: number | "auto" }>({
    left: "auto",
    right: GUTTER_PX,
  });

  // read persisted dismissal
  React.useEffect(() => {
    try { setDismissed(localStorage.getItem(STORAGE_KEY) === "1"); } catch {}
  }, []);

  // publish height → CSS var so <main> reserves space
  const publishHeight = React.useCallback(() => {
    if (!ref.current) return;
    const h = Math.ceil(ref.current.getBoundingClientRect().height) + 16;
    console.log(`Setting --sticky-cta-h to ${h}px for mode ${mode}`);
    document.documentElement.style.setProperty("--sticky-cta-h", `${h}px`);
  }, [mode]);

  // keep height up-to-date on any size change
  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(() => publishHeight());
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [publishHeight]);

  // compute adaptive mode/position/width
  const computePosition = React.useCallback(() => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 0;
    console.log(`Viewport: ${vw}px`);

    // Mobile/tablet → full-width bar
    if (vw < 768) {
      const w = Math.max(MIN_PANEL, Math.min(vw - 2 * GUTTER_PX, MAX_PANEL));
      setMode("bar");
      setPanelW(w);
      setPos({ left: GUTTER_PX, right: GUTTER_PX });
      console.log(`Mode: bar, Width: ${w}px, Pos: left ${GUTTER_PX}px, right ${GUTTER_PX}px`);
      return;
    }

    // Desktop: available gutter width outside the content
    const rawSide = Math.max(0, (vw - CONTENT_PX) / 2);
    const usableGutter = Math.max(0, rawSide - GUTTER_PX); // keep a 16px inner pad
    console.log(`Raw Side: ${rawSide}px, Usable Gutter: ${usableGutter}px`);

    // Enough to dock the full panel?
    if (usableGutter >= MAX_PANEL) {
      setMode("dock");
      setPanelW(MAX_PANEL);
      // place inside the gutter, hugging the viewport edge with 16px pad
      setPos({ left: "auto", right: GUTTER_PX });
      console.log(`Mode: dock, Width: ${MAX_PANEL}px, Right: ${GUTTER_PX}px`);
      return;
    }

    // Enough for a reduced panel?
    if (usableGutter >= MIN_PANEL) {
      setMode("dock");
      setPanelW(Math.floor(usableGutter));
      setPos({ left: "auto", right: GUTTER_PX });
      console.log(`Mode: dock, Width: ${Math.floor(usableGutter)}px, Right: ${GUTTER_PX}px`);
      return;
    }

    // Not enough gutter → use a tiny FAB so it never covers cards
    setMode("fab");
    setPanelW(FAB_SIZE + FAB_PAD * 2);
    setPos({ left: "auto", right: GUTTER_PX });
    console.log(`Mode: fab, Width: ${FAB_SIZE + FAB_PAD * 2}px, Right: ${GUTTER_PX}px`);
  }, []);

  // show/hide + shrink on scroll
  React.useEffect(() => {
    let lastY = 0;
    let ticking = false;

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

  // keep reserved height in sync
  React.useEffect(() => {
    if (!visible) {
      document.documentElement.style.setProperty("--sticky-cta-h", "0px");
      return;
    }
    publishHeight();
  }, [visible, collapsed, panelW, mode, publishHeight]);

  // extra pass post-mount (fonts/layout settle)
  React.useEffect(() => {
    const id = requestAnimationFrame(() => {
      computePosition();
      publishHeight();
    });
    return () => cancelAnimationFrame(id);
  }, [computePosition, publishHeight]);

  // cleanup css var on unmount
  React.useEffect(() => () => {
    document.documentElement.style.setProperty("--sticky-cta-h", "0px");
  }, []);

  const onDismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setDismissed(true);
    document.documentElement.style.setProperty("--sticky-cta-h", "0px");
  };

  if (dismissed || !visible) return null;

  // --- FAB mode (tiny) ---
  if (mode === "fab") {
    return (
      <aside
        role="complementary"
        aria-label="Quick contact"
        className={clsx("fixed bottom-4 z-[70] transition-opacity", className)}
        style={{
          width: panelW,
          right: typeof pos.right === "number" ? pos.right : undefined,
          left: typeof pos.left === "number" ? pos.left : undefined,
        }}
      >
        <div
          ref={ref}
          className="relative rounded-full bg-white/95 shadow-card backdrop-blur dark:bg-deepCharcoal/95"
          style={{ padding: FAB_PAD }}
        >
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="absolute -right-2 -top-2 rounded-full bg-black/70 px-1 text-[11px] leading-none text-white hover:bg-black/80"
            title="Dismiss"
          >
            ×
          </button>

          <Link
            href={isInternal(primaryHref) ? primaryHref : "#"}
            onClick={(e) => {
              if (!isInternal(primaryHref)) {
                e.preventDefault();
                window.open(primaryHref, "_blank", "noopener,noreferrer");
              }
            }}
            prefetch={false}
            aria-label={primaryLabel}
            title={primaryLabel}
            className={clsx(
              "flex h-[56px] w-[56px] items-center justify-center rounded-full bg-emerald-600 text-white",
              "shadow transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
            )}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden fill="currentColor">
              <path d="M3 12a7 7 0 0 1 7-7h4a7 7 0 1 1 0 14H9l-4 4v-4a7 7 0 0 1-2-7z" />
            </svg>
          </Link>
        </div>
      </aside>
    );
  }

  // --- Docked / Mobile bar ---
  return (
    <aside
      role="complementary"
      aria-label="Quick contact"
      className={clsx("fixed bottom-4 z-[70] transition-[transform,opacity] duration-200", className)}
      style={{
        width: `${panelW}px`,
        right: typeof pos.right === "number" ? pos.right : undefined,
        left: typeof pos.left === "number" ? pos.left : undefined,
      }}
    >
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
          className={clsx(
            "absolute right-2 top-2 rounded-md p-1 text-deepCharcoal/60 hover:bg-black/5",
            "dark:text-cream/70 dark:hover:bg-white/10"
          )}
          title="Dismiss"
        >
          <span aria-hidden>×</span>
        </button>

        <div className={clsx("flex items-center gap-3 sm:gap-4", collapsed && "gap-2")}>
          <a
            href={phoneHref}
            className={clsx(
              "inline-flex shrink-0 items-center justify-center rounded-full border border-emerald-600/30 bg-emerald-50 px-3 py-2",
              "hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
              "dark:bg-emerald-900/30 dark:border-emerald-400/30 dark:hover:bg-emerald-900/50"
            )}
            aria-label={phoneLabel}
            title={phoneLabel}
          >
            <PhoneIcon />
          </a>

          <div className="min-w-0 flex-1">
            {!collapsed && (
              <p className="truncate text-sm font-medium text-forest dark:text-cream">
                Let’s build something enduring.
              </p>
            )}

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