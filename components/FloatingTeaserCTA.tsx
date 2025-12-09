"use client";

import * as React from "react";
import TeaserRequest from "@/components/TeaserRequest";

const LS_KEY = "fwt_teaser_dismissed_until";

export default function FloatingTeaserCTA(): JSX.Element | null {
  const [open, setOpen] = React.useState(false);
  const [visible, setVisible] = React.useState(false);

  // Show after short delay if not snoozed
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const until = Number(window.localStorage.getItem(LS_KEY) || 0);
    const now = Date.now();
    if (now < until) return; // snoozed

    const t = window.setTimeout(() => setVisible(true), 5000);
    return () => window.clearTimeout(t);
  }, []);

  function snooze(days = 7): void {
    if (typeof window !== "undefined") {
      const until = Date.now() + days * 24 * 60 * 60 * 1000;
      window.localStorage.setItem(LS_KEY, String(until));
    }
    setOpen(false);
    setVisible(false);
  }

  const handleBackdropClick = (
    e: React.MouseEvent<HTMLButtonElement>
  ): void => {
    if (e.target === e.currentTarget) {
      snooze();
    }
  };

  const handleBackdropKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>
  ): void => {
    if (e.key === "Escape") {
      snooze();
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm font-medium text-cream shadow-[0_18px_45px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-[1px] hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)/0.7]"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="teaser-cta-panel"
      >
        <span className="hidden sm:inline">Get the free teaser</span>
        <span className="sm:hidden">Free teaser</span>
      </button>

      {/* Dialog */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          id="teaser-cta-panel"
          className="fixed inset-0 z-50 flex items-end justify-end bg-black/30 backdrop-blur-sm"
        >
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={handleBackdropClick}
            onKeyDown={handleBackdropKeyDown}
            aria-label="Close teaser dialog"
          />

          {/* Panel */}
          <div
            className="relative m-5 w-full max-w-md rounded-2xl border border-lightGrey bg-white/95 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur"
            role="document"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-deepCharcoal">
                  Fathering Without Fear — Teaser
                </p>
                <p className="mt-1 text-xs text-[color:var(--color-on-secondary)/0.8]">
                  A short, cinematic preview of the story they thought they
                  knew.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => snooze()}
                  className="text-[0.68rem] text-[color:var(--color-on-secondary)/0.7] underline underline-offset-2 hover:text-deepCharcoal"
                  title="Hide for a week"
                >
                  hide 7 days
                </button>
                <button
                  type="button"
                  onClick={() => snooze(365)}
                  className="text-[0.68rem] text-[color:var(--color-on-secondary)/0.7] underline underline-offset-2 hover:text-deepCharcoal"
                  title="Never show again"
                >
                  never
                </button>
                <button
                  type="button"
                  onClick={() => snooze()}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-[color:var(--color-on-secondary)/0.7] hover:bg-lightGrey/60 hover:text-deepCharcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)/0.7]"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <TeaserRequest />
          </div>
        </div>
      )}
    </>
  );
}
