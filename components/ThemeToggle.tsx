// components/ThemeToggle.tsx
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Sparkles } from "lucide-react";

import { useTheme } from "@/lib/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Move constants outside component to prevent recreation
const SIZE_CLASSES = {
  sm: "w-12 h-6",
  md: "w-16 h-8",
  lg: "w-20 h-10",
} as const;

const ICON_SIZES = {
  sm: 12,
  md: 16,
  lg: 20,
} as const;

const THUMB_POSITIONS = {
  sm: { light: 26, dark: 2 },
  md: { light: 34, dark: 4 },
  lg: { light: 42, dark: 6 },
} as const;

export default function ThemeToggle({
  className = "",
  size = "md",
}: ThemeToggleProps): JSX.Element {
  const { resolvedTheme, setTheme } = useTheme();
  const [isHovered, setIsHovered] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch by waiting for client
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  const toggleTheme = React.useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div 
        className={`${SIZE_CLASSES[size]} rounded-full border-2 border-softGold/30 bg-charcoal/80 ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <motion.button
      className={`
        relative ${SIZE_CLASSES[size]} rounded-full border-2 border-softGold/30 
        bg-gradient-to-br from-charcoal/80 to-charcoal shadow-lg 
        backdrop-blur-sm transition-all duration-500 
        hover:border-softGold/60 hover:shadow-xl
        focus:outline-none focus:ring-2 focus:ring-softGold/50 focus:ring-offset-2 focus:ring-offset-charcoal
        ${className}
      `}
      onClick={toggleTheme}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileTap={{ scale: 0.95 }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      type="button"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-softGold/10 via-transparent to-softGold/5 opacity-0 transition-opacity duration-500 hover:opacity-100" />

      {/* Track */}
      <div className="relative h-full w-full overflow-hidden rounded-full">
        {/* Animated background particles */}
        <AnimatePresence>
          {isHovered && (
            <React.Fragment>
              <motion.div
                className="absolute top-1 left-2 h-1 w-1 rounded-full bg-softGold"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.1 }}
              />
              <motion.div
                className="absolute bottom-2 right-4 h-0.5 w-0.5 rounded-full bg-softGold"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.2 }}
              />
            </React.Fragment>
          )}
        </AnimatePresence>

        {/* Thumb */}
        <motion.div
          className={`
            absolute top-1/2 -translate-y-1/2
            flex items-center justify-center
            rounded-full bg-gradient-to-br from-softGold to-amber-200
            shadow-lg
            ${size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-8 w-8"}
          `}
          initial={false}
          animate={{
            x: isDark ? THUMB_POSITIONS[size].dark : THUMB_POSITIONS[size].light,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        >
          {/* Sparkle effect */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Sparkles
                  size={ICON_SIZES[size] - 8}
                  className="text-charcoal/80"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sun/Moon Icons */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isDark ? "moon" : "sun"}
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
              className="absolute"
            >
              {isDark ? (
                <Moon
                  size={ICON_SIZES[size] - 4}
                  className="text-charcoal"
                  fill="currentColor"
                />
              ) : (
                <Sun size={ICON_SIZES[size] - 4} className="text-charcoal" />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Background stars for dark mode */}
        <AnimatePresence>
          {isDark && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute top-1 left-4 h-0.5 w-0.5 rounded-full bg-softGold/60" />
              <div className="absolute top-3 right-2 h-0.5 w-0.5 rounded-full bg-softGold/40" />
              <div className="absolute bottom-2 left-6 h-0.5 w-0.5 rounded-full bg-softGold/50" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-softGold/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  );
}