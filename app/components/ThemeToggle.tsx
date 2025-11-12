"use client";

import React from "react";
// Alias to avoid conflict with any global/local `useTheme`
import { useTheme as useAppTheme } from '...';

interface ThemeToggleProps {
  className?: string;
  variant?: "light" | "dark" | "auto";
  size?: "sm" | "md" | "lg";
  "aria-label"?: string;
  showTooltip?: boolean;
  disabled?: boolean;
  onThemeChange?: (theme: string) => void;
}

export default function ThemeToggle({
  className = "",
  variant,
  size = "md",
  "aria-label": customAriaLabel,
  showTooltip = false,
  disabled = false,
  onThemeChange,
}: ThemeToggleProps) {
  // Use the aliased hook
  const themeContext = useAppTheme() as any;
  const { theme, mounted, toggle } = themeContext;
  const resolvedTheme = themeContext.resolvedTheme || theme;

  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  React.useEffect(() => {
    if (mounted && onThemeChange) {
      onThemeChange(resolvedTheme);
    }
  }, [resolvedTheme, mounted, onThemeChange]);

  const sizeConfig = {
    sm: {
      button: "w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg",
      icon: "w-3.5 h-3.5",
      container: "p-2 rounded-md",
      touch: "min-w[44px] min-h[44px]",
    },
    md: {
      button: "w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl",
      icon: "w-4.5 h-4.5",
      container: "p-2.5 rounded-lg",
      touch: "min-w-[48px] min-h-[48px]",
    },
    lg: {
      button: "w-14 h-14 min-w-[56px] min-h-[56px] rounded-2xl",
      icon: "w-5.5 h-5.5",
      container: "p-3 rounded-lg",
      touch: "min-w-[56px] min-h-[56px]",
    },
  } as const;

  const baseStyles = `
    inline-flex items-center justify-center 
    border transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 
    focus:ring-offset-white dark:focus:ring-offset-gray-900
    relative select-none cursor-pointer
    disabled:opacity-50 disabled:cursor-not-allowed
    motion-reduce:transition-none
    ${sizeConfig[size].button}
    ${sizeConfig[size].touch}
  `
    .replace(/\s+/g, " ")
    .trim();

  const getAriaLabel = () => {
    if (customAriaLabel) return customAriaLabel;
    if (!mounted) return "Toggle theme";
    return `Switch to ${resolvedTheme === "light" ? "dark" : "light"} theme`;
  };

  const getTooltipText = () => {
    if (!mounted) return "Loading theme...";
    const current = resolvedTheme === "light" ? "Light" : "Dark";
    return `${current} mode`;
  };

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label={getAriaLabel()}
        disabled
        className={`${baseStyles} bg-gray-200 border-gray-300 text-gray-400 ${className}`}
      >
        <div
          className={`flex items-center justify-center rounded ${sizeConfig[size].container} bg-gray-300`}
        >
          <svg
            width={sizeConfig[size].icon}
            height={sizeConfig[size].icon}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" opacity="0.3" />
          </svg>
        </div>
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-label={getAriaLabel()}
        aria-pressed={isDark}
        disabled={disabled}
        onClick={toggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        className={`
          ${baseStyles}
          ${isDark ? "bg-gray-800 border-gray-600 text-amber-300" : "bg-white border-gray-200 text-amber-600"}
          ${className}
          ${isPressed ? "scale-95" : "hover:scale-105"}
        `.trim()}
      >
        <div
          className={`
            flex items-center justify-center rounded
            ${sizeConfig[size].container}
            ${isDark ? "bg-gray-700 shadow-inner" : "bg-gray-200 shadow-inner"}
            ${isPressed ? "scale-90" : ""}
          `}
        >
          {isDark ? (
            <svg
              width={sizeConfig[size].icon}
              height={sizeConfig[size].icon}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" />
            </svg>
          ) : (
            <svg
              width={sizeConfig[size].icon}
              height={sizeConfig[size].icon}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
            </svg>
          )}
        </div>
      </button>

      {showTooltip && isHovered && !disabled && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50"
        >
          {getTooltipText()}
        </div>
      )}
    </div>
  );
}
