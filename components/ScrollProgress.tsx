import React from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import clsx from "clsx";

type ScrollProgressProps = {
  className?: string;
  heightClass?: string;
  colorClass?: string;
  zIndexClass?: string;
};

const ScrollProgress: React.FC<ScrollProgressProps> = ({
  className,
  heightClass = "h-1",
  colorClass = "bg-forest",
  zIndexClass = "z-50",
}) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  return (
    <motion.div
      className={clsx(
        "fixed top-0 left-0 right-0 origin-left",
        heightClass,
        colorClass,
        zIndexClass,
        className,
      )}
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
};

export default ScrollProgress;




