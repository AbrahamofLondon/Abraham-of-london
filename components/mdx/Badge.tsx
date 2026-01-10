// components/mdx/Badge.tsx
import * as React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  tone?: "neutral" | "primary" | "accent" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

/**
 * Badge - Versatile badge component for tags, status, and labels
 * Usage in MDX: <Badge tone="primary">Featured</Badge>
 */
const Badge: React.FC<BadgeProps> = ({
  children,
  tone = "neutral",
  size = "md",
  className = "",
  onClick,
  ...rest
}) => {
  const toneClasses = {
    neutral: "bg-warmWhite text-gray-800 border-lightGrey",
    primary: "bg-forest text-cream border-forest/80",
    accent: "bg-softGold/90 text-deepCharcoal border-softGold",
    success: "bg-emerald-100 text-emerald-800 border-emerald-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    error: "bg-red-100 text-red-800 border-red-200",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-[0.7rem]",
    lg: "px-4 py-1.5 text-xs",
  };

  const interactiveClass = onClick
    ? "cursor-pointer transition-all hover:scale-105 active:scale-95"
    : "";

  // Use button element when onClick is provided, span otherwise
  if (onClick) {
    return (
      <button
        type="button"
        className={[
          "inline-flex items-center rounded-full border font-semibold uppercase tracking-wide",
          toneClasses[tone],
          sizeClasses[size],
          interactiveClass,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={onClick}
        {...rest}
      >
        {children}
      </button>
    );
  }

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border font-semibold uppercase tracking-wide",
        toneClasses[tone],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </span>
  );
};

export default Badge;

