"use client";

import clsx from "clsx";
import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";

type ScrollProgressProps = {
  className?: string;
  heightClass?: string;
  colorClass?: string;
  zIndexClass?: string;
  position?: "top" | "bottom";
};

export default function ScrollProgress({
  className,
  heightClass = "h-1",
  colorClass = "bg-softGold",
  zIndexClass = "z-[60]",
  position = "top",
}: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const prefersReducedMotion = useReducedMotion();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const scaleStyle = prefersReducedMotion ? 0 : scaleX;

  return (
    <motion.div
      aria-hidden="true"
      className={clsx(
        "fixed left-0 right-0 origin-left",
        position === "top" ? "top-0" : "bottom-0",
        heightClass,
        colorClass,
        zIndexClass,
        className
      )}
      style={{ scaleX: scaleStyle }}
    />
  );
}
