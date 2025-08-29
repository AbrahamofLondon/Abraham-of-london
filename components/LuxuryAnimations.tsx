// components/LuxuryAnimations.tsx  (or components/LuxuryAnimator.tsx)
"use client";

import * as React from "react";
import { motion, useReducedMotion, type Transition } from "framer-motion";
import clsx from "clsx";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

type Props = {
  /** Visible title; if omitted, you can pass custom children */
  title?: string;
  /** Which heading tag to render for the title */
  headingAs?: HeadingTag; // no JSX namespace needed
  /** Extra classes for the outer container */
  className?: string;
  /** Animate on mount (default) or only when in view */
  inView?: boolean;
  /** Optional aria-label if you don’t use a title */
  ariaLabel?: string;
  children?: React.ReactNode;
};

// Typed cubic-bezier so Transition["ease"] is satisfied
const EASE: Transition["ease"] = [0.16, 1, 0.3, 1];

export default function LuxuryAnimator({
  title = "LuxuryAnimator",
  headingAs = "h2",
  className,
  inView = true,
  ariaLabel,
  children,
}: Props) {
  const prefersReduced = useReducedMotion();
  const Heading = headingAs; // string tag is fine for React elements

  const initial = prefersReduced
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.96, y: 6 };
  const animate = prefersReduced
    ? { opacity: 1 }
    : { opacity: 1, scale: 1, y: 0 };
  const transition: Transition = { duration: 0.55, ease: EASE };

  const titleId = React.useId();
  const labelledBy = title ? titleId : undefined;
  const label = ariaLabel && !title ? ariaLabel : undefined;

  const containerCls = clsx(
    "rounded-2xl p-8 shadow-xl",
    "bg-gradient-to-br from-forest to-emerald-700 text-cream",
    className
  );

  return (
    <section aria-labelledby={labelledBy} aria-label={label}>
      <motion.div
        className={containerCls}
        initial={initial}
        {...(inView
          ? { whileInView: animate, viewport: { once: true, amount: 0.25 } }
          : { animate })}
        transition={transition}
      >
        {title && (
          <Heading
            id={titleId}
            className="text-3xl font-serif font-bold tracking-wide text-center"
          >
            {title}
          </Heading>
        )}

        {children}
      </motion.div>
    </section>
  );
}
