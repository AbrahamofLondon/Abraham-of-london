"use client";

import * as React from "react";
import type { ButtonHTMLAttributes } from "react";

export interface ThemeToggleProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  variant?: "icon" | "button";
}

// For now, this is just a dummy button so the header doesn’t break.
export function ThemeToggle({
  variant = "icon",
  className = "",
  ...buttonProps
}: ThemeToggleProps): JSX.Element {
  const baseClasses =
    "inline-flex items-center justify-center rounded-full border border-slate-500 " +
    "bg-slate-900 px-2 py-2 text-sm text-slate-100 shadow-sm " +
    "opacity-60 cursor-default";

  const icon = "🌙";

  return (
    <button
      type="button"
      aria-label="Theme toggle disabled"
      className={[baseClasses, className].filter(Boolean).join(" ")}
      disabled
      {...buttonProps}
    >
      {variant === "icon" ? (
        <span aria-hidden="true">{icon}</span>
      ) : (
        <span className="flex items-center gap-2">
          <span aria-hidden="true">{icon}</span>
          <span>Dark mode</span>
        </span>
      )}
    </button>
  );
}

export default ThemeToggle;