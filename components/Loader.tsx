"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Props = {
  /** If provided, becomes controlled. If omitted, the loader auto-hides after `autohideAfterMs`. */
  show?: boolean;
  /** Auto-hide delay (ms) when `show` is uncontrolled. */
  autohideAfterMs?: number;
  /** Fade-out duration (ms) */
  fadeMs?: number;
  /** Optional extra classes for the backdrop */
  backdropClassName?: string;
  /** Spinner diameter in px */
  spinnerSize?: number;
  /** Spinner border width in px */
  borderWidth?: number;
};

export default function LuxuryLoader({
  show,
  autohideAfterMs = 1500,
  fadeMs = 400,
  backdropClassName = "",
  spinnerSize = 64,
  borderWidth = 4,
}: Props) {
  const prefersReducedMotion = useReducedMotion();

  // Uncontrolled mode: start visible, then hide after delay.
  const [internalShow, setInternalShow] = React.useState<boolean>(show ?? true);

  // Sync controlled -> internal
  React.useEffect(() => {
    if (show !== undefined) setInternalShow(show);
  }, [show]);

  // Auto-hide only when *uncontrolled*
  React.useEffect(() => {
    if (show === undefined) {
      const t = window.setTimeout(
        () => setInternalShow(false),
        autohideAfterMs
      );
      return () => window.clearTimeout(t);
    }
  }, [show, autohideAfterMs]);

  return (
    <AnimatePresence>
      {internalShow && (
        <motion.div
          key="luxury-loader"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: fadeMs / 1000 }}
          className={[
            "fixed inset-0 z-50 flex items-center justify-center",
            // Safer backdrop tokens from your palette:
            // use your brand variables or Tailwind tokens that exist
            "bg-white/85 backdrop-blur-sm dark:bg-black/60",
            backdropClassName,
          ].join(" ")}
          role="status"
          aria-live="polite"
          aria-label="Loading content"
        >
          <motion.div
            // Spin for normal motion; gentle pulse for reduced motion
            animate={
              prefersReducedMotion ? { scale: [1, 1.06, 1] } : { rotate: 360 }
            }
            transition={
              prefersReducedMotion
                ? { repeat: Infinity, duration: 1.4, ease: "easeInOut" }
                : { repeat: Infinity, duration: 1.4, ease: "linear" }
            }
            style={{
              width: spinnerSize,
              height: spinnerSize,
              borderWidth,
            }}
            className={[
              "rounded-full border-solid",
              // ring background + brand accent for the top segment
              "border-[color:var(--color-on-secondary)/0.15] dark:border-[color:var(--color-on-primary)/0.2]",
              "border-t-softGold",
              "shadow-md",
            ].join(" ")}
          />
          <span className="sr-only">Loading…</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
