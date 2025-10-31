"use client";

import * as React from "react";
import Link from "next/link";
import clsx from "clsx";

interface FloatingTeaserCTAProps {
  delayMs?: number;
  hideAfterMs?: number;
  snoozeHours?: number;
  className?: string;
  linkHref?: string;
  linkText?: string;
  title?: string;
  text?: string;
}

const STORAGE_KEY = "a_of_l_teaser_snooze";

export default function FloatingTeaserCTA({
  delayMs = 5000,
  hideAfterMs = 20000,
  snoozeHours = 6,
  className,
  linkHref = "/books/fathering-without-fear",
  linkText = "Get the Teaser",
  title = "Fathering Without Fear",
  // THIS IS THE FIX: The apostrophe in "It's" is replaced with "&apos;"
  text = "It&apos;s the field memoir for fathers in the arena.",
}: FloatingTeaserCTAProps) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const until = window.localStorage.getItem(STORAGE_KEY);
    const now = Date.now();
    if (until && now < parseInt(until, 10)) return;

    const t = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs]);

  React.useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => {
      setVisible(false);
      const snoozeUntil = Date.now() + snoozeHours * 60 * 60 * 1000;
      window.localStorage.setItem(STORAGE_KEY, String(snoozeUntil));
    }, hideAfterMs);
    return () => window.clearTimeout(t);
  }, [visible, hideAfterMs, snoozeHours]);

  const handleDismiss = () => {
    setVisible(false);
    const snoozeUntil = Date.now() + 24 * snoozeHours * 60 * 60 * 1000;
    window.localStorage.setItem(STORAGE_KEY, String(snoozeUntil));
  };

  if (!visible) return null;

  return (
    <div
      className={clsx(
        "fixed bottom-4 right-4 z-50 w-11/12 max-w-sm rounded-lg bg-warm-cream p-4 shadow-xl ring-1 ring-black/5 transition-all duration-300 ease-out md:bottom-8 md:right-8",
        "animate-in fade-in slide-in-from-bottom-1/2",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-md font-semibold text-soft-charcoal md:text-lg">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-700">{text}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          aria-label="Dismiss"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <Link
        href={linkHref}
        className="mt-4 block rounded-full bg-deep-forest px-4 py-2 text-center text-sm font-medium text-warm-cream transition hover:bg-deep-forest/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-forest/40"
      >
        {linkText}
      </Link>
    </div>
  );
}