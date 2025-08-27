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

// matches Layout’s max content width (max-w-7xl = 1280px)
const CONTENT_PX = 1280;
const PAD = 16;            // safe edge padding
const FAB_SIZE = 56;       // tiny floating action button
const FAB_PAD  = 10;       // visual padding around FAB

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
  const cardRef  = React.useRef<HTMLDivElement | null>(null);

  const [visible, setVisible] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  // Mode is derived from actual width:
  // - "fab": card width < 120px
  // - "compact": card width < 280px
  // - "full": otherwise
  const [isFab, setIsFab] = React.useState(false);
  const [isCompact, setIsCompact] = React.useState(false);

  // read persisted dismissal
  React.useEffect(() => {
    try { setDismissed(localStorage.getItem(STORAGE_KEY) === "1"); } catch {}
  }, []);

  // publish height → CSS var so <main> reserves space
  const publishHeight = React.useCallback(() => {
    if (!shellRef.current) return;
    const h = Math.ceil(shellRef.current.getBoundingClientRect().height) + 16;
    document.documentElement.style.setProperty("--sticky-cta-h", `${h}px`);
  }, []);

  // keep height up to date
  React.useEffect(() => {
    if (!shellRef.current) return;
    const ro = new ResizeObserver(() => publishHeight());
    ro.observe(shellRef.current);
    return () => ro.disconnect();
  }, [publishHeight]);

  // detect width → pick visual mode
  React.useEffect(() => {
    if (!cardRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry?.contentRect?.width || 0;
      setIsFab(w < 120);
      setIsCompact(w >= 120 && w < 280);
    });
    ro.observe(cardRef.current);
    return () => ro.disconnect();
  }, []);

  // show/hide + collapse on scroll
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

    // init
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showAfter]);

  // keep reserved height synced with mode changes
  React.useEffect(() => {
    if (!visible) {
      document.documentElement.style.setProperty("--sticky-cta-h", "0px");
      return;
    }
    publishHeight();
  }, [visible, collapsed, isFab, isCompact, publishHeight]);

  // cleanup var on unmount
  React.useEffect(() => () => {
    document.documentElement.style.setProperty("--sticky-cta-h", "0px");
  }, []);

  const onDismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setDismissed(true);
    document.documentElement.style.setProperty("--sticky-cta-h", "0px");
  };

  if (dismissed || !visible) return null;

  /**
   * Pure CSS positioning & sizing:
   *
   * --gutter:  half the leftover outside the 1280px container
   * --avail:   space we can use in the gutter after a small inner pad
   * width:     clamp between a tiny minimum (for FAB) and 360px, never exceeding the gutter
   * right:     stick to viewport’s right with a safe PAD
   *
   * When the gutter is narrow (e.g. 1366px screens), width shrinks automatically.
   * ResizeObserver flips visual modes based on the actual width.
   */
  const style: React.CSSProperties = {
    // compute the gutter based on current viewport, using CSS math:
    // we keep right: PAD so it hugs the edge; width is what prevents overlap.
    // @ts-expect-error – custom props used by the template string
    "--content": `${CONTENT_PX}px`,
  } as React.CSSProperties;

  return (
    <aside
      role="complementary"
      aria-label="Quick contact"
      className={clsx("fixed bottom-4 z-[70]", className)}
      // NOTE: width is fully driven by CSS here – no JS numbers to get wrong.
      style={{
        ...style,
        // sit at the right edge with a small pad
        right: PAD,
        left: "auto",
        // clamp width to the gutter:
        //  - available gutter = ( (100vw - 1280px) / 2 ) - PAD
        //  - never less than the FAB size (incl. its inner padding), never more than 360px
        width: `clamp(${FAB_SIZE + FAB_PAD * 2}px, calc(((100vw - ${CONTENT_PX}px) / 2) - ${PAD}px), 360px)`,
        // keep smooth enter/exit
        transition: "transform 200ms, opacity 200ms",
      }}
      ref={shellRef}
    >
      {/* FAB MODE -------------------------------------------------------- */}
      {isFab ? (
        <div
          ref={cardRef}
          className="relative rounded-full bg-white/95 shadow-card backdrop-blur dark:bg-deepCharcoal/95"
          style={{ padding: FAB_PAD }}
        >
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="absolute -right-2 -top-2 rounded-full bg-black/70 px-1 text-[11px] leading-none text-white hover:bg-black/80 dark:bg-white/20 dark:hover:bg-white/30"
            title="Dismiss"
          >
            ×
          </button>

          {/* FAB opens the primary CTA */}
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
      ) : (
        /* DOCKED / COMPACT CARD ---------------------------------------- */
        <div
          ref={cardRef}
          className={clsx(
            "relative overflow-hidden rounded-2xl border border-forest/15 bg-white/95 shadow-card backdrop-blur",
            "px-4 py-3 sm:px-5 sm:py-4 dark:bg-deepCharcoal/95 dark:border-white/10",
            collapsed && "px-3 py-2 sm:px-3 sm:py-2"
          )}
        >
          {/* Dismiss */}
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
            {/* Phone button */}
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
              {/* hide tagline in compact mode to save space */}
              {!collapsed && !isCompact && (
                <p className="truncate text-sm font-medium text-forest dark:text-cream">
                  Let’s build something enduring.
                </p>
              )}

              <div className={clsx("mt-2 flex flex-wrap gap-2", (collapsed || isCompact) && "mt-0")}>
                {/* Primary */}
                {isInternal(primaryHref) ? (
                  <Link
                    href={primaryHref}
                    prefetch={false}
                    className={clsx(
                      "inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white",
                      "shadow-sm transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
                      (collapsed || isCompact) && "px-3 py-1 text-[13px]"
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
                      (collapsed || isCompact) && "px-3 py-1 text-[13px]"
                    )}
                    aria-label={primaryLabel}
                  >
                    {primaryLabel}
                  </a>
                )}

                {/* Secondary is hidden in compact mode */}
                {!collapsed && !isCompact &&
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
      )}
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
}"use client";

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

// layout constants
const CONTENT_PX = 1280; // max-w-7xl
const PAD = 16;

// sizes
const CARD_W = 360;      // full card width when docked
const FAB_SIZE = 56;     // tiny floating pill
const FAB_PAD  = 10;

type Mode = "bar" | "fab" | "dock";

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
  const [mode, setMode] = React.useState<Mode>("fab");
  const [pos, setPos] = React.useState<{ left: number | "auto"; right: number | "auto" }>({
    left: "auto",
    right: PAD,
  });

  // remember dismissal
  React.useEffect(() => {
    try { setDismissed(localStorage.getItem(STORAGE_KEY) === "1"); } catch {}
  }, []);

  // reserve space at the bottom so nothing is covered
  const publishHeight = React.useCallback(() => {
    if (!shellRef.current) return;
    const h = Math.ceil(shellRef.current.getBoundingClientRect().height) + 16;
    document.documentElement.style.setProperty("--sticky-cta-h", `${h}px`);
  }, []);

  React.useEffect(() => {
    if (!shellRef.current) return;
    const ro = new ResizeObserver(() => publishHeight());
    ro.observe(shellRef.current);
    return () => ro.disconnect();
  }, [publishHeight]);

  // pick mode + position from viewport
  const computeMode = React.useCallback(() => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 0;

    if (vw < 768) {
      // phones: full-width bar
      setMode("bar");
      setPos({ left: PAD, right: PAD });
      return;
    }

    if (vw < 1536) {
      // laptops / narrow desktops: tiny FAB so it never overlaps content
      setMode("fab");
      setPos({ left: "auto", right: PAD });
      return;
    }

    // roomy desktops: docked card in the outer gutter
    const rightGutter = Math.max(PAD, (vw - CONTENT_PX) / 2 + PAD);
    setMode("dock");
    setPos({ left: "auto", right: Math.floor(rightGutter) });
  }, []);

  // show/hide + collapse on scroll
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

    computeMode();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", computeMode);
    window.addEventListener("orientationchange", computeMode);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", computeMode);
      window.removeEventListener("orientationchange", computeMode);
    };
  }, [showAfter, computeMode]);

  // keep bottom padding synced
  React.useEffect(() => {
    if (!visible) {
      document.documentElement.style.setProperty("--sticky-cta-h", "0px");
      return;
    }
    publishHeight();
  }, [visible, collapsed, mode, publishHeight]);

  // cleanup on unmount
  React.useEffect(() => () => {
    document.documentElement.style.setProperty("--sticky-cta-h", "0px");
  }, []);

  const onDismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setDismissed(true);
    document.documentElement.style.setProperty("--sticky-cta-h", "0px");
  };

  if (dismissed || !visible) return null;

  // ---- FAB (small circle) ----
  if (mode === "fab") {
    return (
      <aside
        role="complementary"
        aria-label="Quick contact"
        className={clsx("fixed bottom-4 z-[70]", className)}
        style={{ right: pos.right as number | undefined, left: "auto" }}
        ref={shellRef}
      >
        <div
          className="relative rounded-full bg-white/95 shadow-card backdrop-blur dark:bg-deepCharcoal/95"
          style={{ padding: FAB_PAD }}
        >
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="absolute -right-2 -top-2 rounded-full bg-black/70 px-1 text-[11px] leading-none text-white hover:bg-black/80 dark:bg-white/20 dark:hover:bg-white/30"
            title="Dismiss"
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

  // shared card container (dock + bar)
  const card = (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-forest/15 bg-white/95 shadow-card backdrop-blur",
        "px-4 py-3 sm:px-5 sm:py-4 dark:bg-deepCharcoal/95 dark:border-white/10",
        collapsed && "px-3 py-2 sm:px-3 sm:py-2"
      )}
    >
      {/* Dismiss */}
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
          {/* Shorter label when collapsed to save space */}
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

            {/* Secondary hidden when collapsed */}
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

  // ---- BAR (phones) ----
  if (mode === "bar") {
    return (
      <aside
        role="complementary"
        aria-label="Quick contact"
        className={clsx("fixed bottom-4 z-[70]", className)}
        style={{
          left: pos.left as number | undefined,
          right: pos.right as number | undefined,
        }}
        ref={shellRef}
      >
        <div className="max-w-[680px] mx-auto">{card}</div>
      </aside>
    );
  }

  // ---- DOCK (roomy desktops) ----
  return (
    <aside
      role="complementary"
      aria-label="Quick contact"
      className={clsx("fixed bottom-4 z-[70]", className)}
      style={{
        width: `${CARD_W}px`,
        right: pos.right as number | undefined,
        left: "auto",
      }}
      ref={shellRef}
    >
      {card}
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

function PhoneArrowIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 12a7 7 0 0 1 7-7h4a7 7 0 1 1 0 14H9l-4 4v-4a7 7 0 0 1-2-7z" />
    </svg>
  );
}


function PhoneArrowIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 12a7 7 0 0 1 7-7h4a7 7 0 1 1 0 14H9l-4 4v-4a7 7 0 0 1-2-7z" />
    </svg>
  );
}
