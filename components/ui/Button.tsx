"use client";

import * as React from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
}

const base =
  "inline-flex items-center justify-center rounded-full font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "bg-softGold text-deepCharcoal shadow-button hover:brightness-95 focus-visible:ring-softGold/40",
  secondary:
    "border border-deepCharcoal text-deepCharcoal hover:bg-deepCharcoal hover:text-cream focus-visible:ring-deepCharcoal/40 dark:border-cream dark:text-cream dark:hover:bg-cream dark:hover:text-deepCharcoal",
  ghost:
    "text-deepCharcoal hover:text-softGold focus-visible:ring-softGold/40 dark:text-cream dark:hover:text-softGold",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2 text-sm",
  lg: "px-7 py-3 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  href,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = clsx(base, variants[variant], sizes[size], className);

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
