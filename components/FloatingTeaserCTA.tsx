// components/FloatingTeaserCTA.tsx

"use client";
import * as React from "react";
import TeaserRequest from "@/components/TeaserRequest";

const LS_KEY = "fwt_teaser_dismissed_until";

export default function FloatingTeaserCTA(): JSX.Element | null {
  const [open, setOpen] = React.useState(false);
  const [visible, setVisible] = React.useState(false);

  // Show after short delay if not snoozed
  React.useEffect(() => {
    const until = Number(localStorage.getItem(LS_KEY) || 0);
    const now = Date.now();
    if (now < until) return; // snoozed

    const t = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(t);
  }, []);

  function snooze(days = 7): void {
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(LS_KEY, String(until));
    setOpen(false);
    setVisible(false);
  }

  const handleBackdropClick = (
    e: React.MouseEvent<HTMLDivElement>,
  ): void => {
    // Only close if the click is on the overlay itself, not inside the dialog
    if (e.target === e.currentTarget) {
      snooze();
    }
  };

  const handleBackdropKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
  ): void => {
    if (e.key === "Escape") {
      snooze();
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Floating button to open teaser */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 rounded-full bg-forest px-4 py-2 text-sm font-medium text-cream shadow-card hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)/0.6]"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="teaser-cta-panel"
      >
        Get the free teaser
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          id="teaser-cta-panel"
          className="fixed inset-0 z-50 flex items-end justify-end bg-black/20 backdrop-blur-[1px]"
          onClick={handleBackdropClick}
          onKeyDown={handleBackdropKeyDown}
        >
          {/* Backdrop – just closes, no event typing needed */}
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => snooze()}
            aria-label="Close teaser dialog"
          />

          {/* Dialog content */}
          <div
            className="relative m-5 w-full max-w-md rounded-2xl border border-lightGrey bg-white p-4 shadow-card"
            role="document"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-deepCharcoal">
                Fathering Without Fear — Teaser
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => snooze()}
                  className="text-xs text-[color:var(--color-on-secondary)/0.7] underline underline-offset-2 hover:text-deepCharcoal"
                  title="Hide for a week"
                >
                  hide 7 days
                </button>
                <button
                  type="button"
                  onClick={() => snooze(365)}
                  className="text-xs text-[color:var(--color-on-secondary)/0.7] underline underline-offset-2 hover:text-deepCharcoal"
                  title="Never show again"
                >
                  never
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