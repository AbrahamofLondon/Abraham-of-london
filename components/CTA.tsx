// components/CTA.tsx
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  /** show the pill on small screens (default true) */
  floatingOnMobile?: boolean;
};

export default function CTA({ floatingOnMobile = true }: Props) {
  const [hasSafeArea, setHasSafeArea] = useState(false);

  useEffect(() => {
    // Check for iOS safe area support
    if (typeof window !== "undefined") {
      const safeAreaTest = getComputedStyle(
        document.documentElement
      ).getPropertyValue("--satest");
      setHasSafeArea(!!safeAreaTest);
    }
  }, []);

  const Pill = (
    <div className="flex items-center gap-3">
      <a
        href="tel:+442086225909"
        aria-label="Call +44 208 622 5909"
        className="grid h-12 w-12 place-items-center rounded-full border border-black/10 bg-white text-emerald-700 shadow ring-1 ring-black/5 transition-colors hover:bg-emerald-50"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.3 1.77.55 2.61a2 2 0 0 1-.45 2.11L8 9a16 16 0 0 0 7 7l.56-1.16a2 2 0 0 1 2.11-.45c.84.25 1.71.43 2.61.55A2 2 0 0 1 22 16.92Z"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </a>

      <Link
        href="/contact"
        className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 transition-colors"
      >
        Work With Me
      </Link>

      <Link
        href="/#newsletter"
        className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 transition-colors"
      >
        Subscribe
      </Link>
    </div>
  );

  return (
    <>
      {/* Desktop inline */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-5xl rounded-2xl border border-black/5 bg-white/80 px-6 py-4 backdrop-blur shadow ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-6">
            <p className="text-slate-800 font-medium">
              Let&apos;s build something enduring.
            </p>
            {Pill}
          </div>
        </div>
      </div>

      {/* Mobile floating pill */}
      {floatingOnMobile && (
        <div
          className="fixed inset-x-4 bottom-4 z-40 md:hidden"
          style={
            hasSafeArea
              ? { paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }
              : undefined
          }
        >
          <div className="rounded-2xl border border-black/10 bg-white/95 p-3 shadow-xl ring-1 ring-black/5 backdrop-blur">
            {Pill}
          </div>
        </div>
      )}
    </>
  );
}