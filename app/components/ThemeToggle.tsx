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

export default function ThemeToggle({
  className = "",
  size = "md",
}: ThemeToggleProps): JSX.Element {
  const { resolvedTheme, setTheme } = useTheme();
  const [isHovered, setIsHovered] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  const sizeClasses: Record<NonNullable<ThemeToggleProps["size"]>, string> = {
    sm: "w-12 h-6",
    md: "w-16 h-8",
    lg: "w-20 h-10",
  };

  const iconSizes: Record<NonNullable<ThemeToggleProps["size"]>, number> = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  const toggleTheme = React.useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  return (
    <motion.button
      className={`
        relative ${sizeClasses[size]} rounded-full border-2 border-softGold/40 
        bg-gradient-to-br from-deepCharcoal to-charcoal shadow-lg 
        backdrop-blur-sm transition-all duration-500 
        hover:border-softGold hover:shadow-glow-gold
        focus:outline-none focus:ring-2 focus:ring-softGold/60 focus:ring-offset-2 focus:ring-offset-deepCharcoal
        ${className}
      `}
      onClick={toggleTheme}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileTap={{ scale: 0.95 }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      type="button"
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-softGold/10 via-transparent to-softGold/5 opacity-0 transition-opacity duration-500 hover:opacity-100" />

      <div className="relative h-full w-full overflow-hidden rounded-full">
        <AnimatePresence>
          {isHovered && (
            <>
              <motion.div
                className="absolute top-1 left-2 h-1 w-1 rounded-full bg-softGold"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.1 }}
              />
              <motion.div
                className="absolute bottom-2 right-4 h-0.5 w-0.5 rounded-full bg-softGold/80"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.2 }}
              />
            </>
          )}
        </AnimatePresence>

        <motion.div
          className={`
            absolute top-1/2 -translate-y-1/2
            flex items-center justify-center
            rounded-full bg-gradient-to-br from-softGold to-amber-200
            shadow-lg
            ${
              size === "sm"
                ? "h-4 w-4"
                : size === "md"
                ? "h-6 w-6"
                : "h-8 w-8"
            }
          `}
          initial={false}
          animate={{
            x: isDark
              ? size === "sm"
                ? 2
                : size === "md"
                ? 4
                : 6
              : size === "sm"
              ? 26
              : size === "md"
              ? 34
              : 42,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        >
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Sparkles
                  size={iconSizes[size] - 8}
                  className="text-deepCharcoal/80"
                />
              </motion.div>
            )}
          </AnimatePresence>

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
                  size={iconSizes[size] - 4}
                  className="text-deepCharcoal"
                  fill="currentColor"
                />
              ) : (
                <Sun
                  size={iconSizes[size] - 4}
                  className="text-amber-500"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {isDark && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute top-1 left-4 h-0.5 w-0.5 rounded-full bg-softGold/70" />
              <div className="absolute top-3 right-2 h-0.5 w-0.5 rounded-full bg-softGold/50" />
              <div className="absolute bottom-2 left-6 h-0.5 w-0.5 rounded-full bg-softGold/60" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        className="absolute inset-0 rounded-full bg-softGold/15"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  );
}