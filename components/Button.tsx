import * as React from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "base" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

function getFontClasses(size: Size): string {
  // Local, stable fallback. Swap to your font helper later if desired.
  switch (size) {
    case "sm":
      return "text-sm font-medium tracking-wide";
    case "lg":
      return "text-base md:text-lg font-semibold tracking-wide";
    default:
      return "text-sm md:text-base font-semibold tracking-wide";
  }
}

export default function Button({
  children,
  variant = "primary",
  size = "base",
  className = "",
  loading = false,
  disabled,
  ...rest
}: ButtonProps): JSX.Element {
  const base =
    "inline-flex items-center justify-center rounded-lg transition-all duration-200 " +
    "focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<Variant, string> = {
    primary:
      "bg-forest text-white hover:bg-forest/90 focus:ring-forest border border-transparent shadow-sm hover:shadow-md",
    secondary:
      "bg-warmWhite text-deepCharcoal hover:bg-gray-100 focus:ring-forest border border-lightGrey shadow-sm hover:shadow-md",
    outline: "bg-transparent text-forest hover:bg-forest/10 focus:ring-forest border border-forest",
    ghost: "bg-transparent text-forest hover:bg-forest/10 focus:ring-forest border border-transparent",
  };

  const sizes: Record<Size, string> = {
    sm: "px-3 py-1.5 gap-1.5",
    base: "px-4 py-2 gap-2",
    lg: "px-6 py-3 gap-2.5",
  };

  const classes = [base, variants[variant], sizes[size], getFontClasses(size), className]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading && (
        <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0A12 12 0 000 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}