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
const LS_KEY = "cta:dismissed";

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
  const [min, setMin] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  // Restore dismissal
  React.useEffect(() => {
    try { setDismissed(localStorage.getItem(LS_KEY) === "1"); } catch {}
  }, []);

  // Scroll handler (show + shrink)
  React.useEffect(() => {
    if (dismissed) return;

    let lastY = 0;
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY || 0;
      setVisible(y > showAfter);

      // shrink when scrolling down a fair bit, expand when scrolling up
      const goingDown = y > lastY + 8;
      const goingUp   = y < lastY - 8;
      if (goingDown && y > showAfter + 120) setMin(true);
      if (goingUp) setMin(false);

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

  // Publish height -> CSS var for bottom padding of <main>
  const publishHeight = React.useCallback(() => {
    const h = ref.current && visible && !dismissed ? ref.current.offsetHeight : 0;
    document.documentElement.style.setProperty("--sticky-cta-h", `${h || 0}px`);
  }, [visible, dismissed]);

  React.useEffect(() => {
    publishHeight();
    const r = ref.current;
    if (!r) return;

    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(publishHeight);
    });
    ro.observe(r);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, [publishHeight]);

  React.useEffect(() => {
    publishHeight();
  }, [min, publishHeight]);

  // Dismiss
  const onDismiss = () => {
    try { localStorage.setItem(LS_KEY, "1"); } catch {}
    setDismissed(true);
    // also clear reserved space
    document.documentElement.style.setProperty("--sticky-cta-h", "0px");
  };

  if (!visible || dismissed) return null;

  return (
    <aside
      className={clsx(
        "fixed bottom-4 right-4 z-[70] max-w-[92vw] sm:max-w-sm",
        className
      )}
      role="complementary"
      aria-label="Quick contact"
    >
      <div
        ref={ref}
        className={clsx(
          "relative rounded-2xl border border-forest/15 bg-white/95 shadow-card backdrop-blur px-4 py-3 sm:px-5 sm:py-4",
          "dark:bg-deepCharcoal/95 dark:border-white/10",
          min && "px-3 py-2 sm:px-4 sm:py-2"
        )}
      >
        {/* Dismiss */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className={clsx(
            "absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white",
            "hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black/50",
            "dark:bg-white/20 dark:text-white dark:hover:bg-white/30"
          )}
        >
          ×
        </button>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* phone */}
          <a
            href={phoneHref}
            className={clsx(
              "inline-flex items-center justify-center shrink-0",
              "rounded-full border border-emerald-600/30 bg-emerald-50 px-3 py-2",
              "hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
              "dark:bg-emerald-900/30 dark:border-emerald-400/30 dark:hover:bg-emerald-900/50"
            )}
            aria-label={phoneLabel}
          >
            <PhoneIcon />
          </a>

          {/* content */}
          <div className="min-w-0 flex-1">
            {!min && (
              <p className="truncate text-sm font-medium text-forest dark:text-cream">
                Let’s build something enduring.
              </p>
            )}
            <div className={clsx("mt-2 flex flex-wrap gap-2", min && "mt-0")}>
              {/* primary */}
              {isInternal(primaryHref) ? (
                <Link
                  href={primaryHref}
                  prefetch={false}
                  className={clsx(
                    "inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white",
                    "shadow-sm transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
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
                    "shadow-sm transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
                  )}
                  aria-label={primaryLabel}
                >
                  {primaryLabel}
                </a>
              )}

              {/* secondary (hide when min to keep pill tiny) */}
              {!min &&
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
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" role="img" className="block" fill="currentColor">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.14a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
