"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Sparkles } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

type ThemeToggleProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASSES = {
  sm: "h-6 w-12",
  md: "h-8 w-16",
  lg: "h-10 w-20",
} as const;

const THUMB_CLASSES = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const;

const ICON_SIZES = {
  sm: 10,
  md: 14,
  lg: 18,
} as const;

const THUMB_X = {
  sm: { dark: 2, light: 26 },
  md: { dark: 4, light: 34 },
  lg: { dark: 6, light: 42 },
} as const;

export default function ThemeToggle({
  className = "",
  size = "md",
}: ThemeToggleProps): React.ReactElement {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  const handleToggle = React.useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className={[
          "rounded-full border border-amber-400/25 bg-black/70",
          SIZE_CLASSES[size],
          className,
        ].join(" ")}
      />
    );
  }

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileTap={{ scale: 0.96 }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={[
        "relative overflow-hidden rounded-full border border-amber-400/25",
        "bg-gradient-to-br from-zinc-900 to-black shadow-[0_8px_24px_rgba(0,0,0,0.35)]",
        "backdrop-blur-sm transition-all duration-300",
        "hover:border-amber-300/45",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        SIZE_CLASSES[size],
        className,
      ].join(" ")}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-amber-200/5 opacity-0 transition-opacity duration-300 hover:opacity-100" />

      <div className="relative h-full w-full overflow-hidden rounded-full">
        <AnimatePresence>
          {isDark && (
            <motion.div
              key="stars"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute left-4 top-1 h-0.5 w-0.5 rounded-full bg-amber-200/70" />
              <div className="absolute bottom-2 left-6 h-0.5 w-0.5 rounded-full bg-amber-200/50" />
              <div className="absolute right-3 top-3 h-0.5 w-0.5 rounded-full bg-amber-200/60" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={false}
          animate={{
            x: isDark ? THUMB_X[size].dark : THUMB_X[size].light,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 32,
          }}
          className={[
            "absolute top-1/2 -translate-y-1/2 rounded-full",
            "flex items-center justify-center",
            "bg-gradient-to-br from-amber-300 to-amber-500 text-black",
            "shadow-[0_4px_14px_rgba(245,158,11,0.35)]",
            THUMB_CLASSES[size],
          ].join(" ")}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDark ? "moon" : "sun"}
              initial={{ opacity: 0, rotate: -90, scale: 0.75 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.75 }}
              transition={{ duration: 0.18 }}
              className="absolute"
            >
              {isDark ? (
                <Moon
                  size={ICON_SIZES[size]}
                  className="text-black"
                  fill="currentColor"
                />
              ) : (
                <Sun size={ICON_SIZES[size]} className="text-black" />
              )}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0, rotate: -120 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0, rotate: 120 }}
                transition={{ duration: 0.2 }}
                className="absolute"
              >
                <Sparkles size={Math.max(8, ICON_SIZES[size] - 4)} className="text-black/80" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.button>
  );
}