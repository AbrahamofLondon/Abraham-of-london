// components/Button.tsx
import { getFontClasses, fontPresets } from '...';

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "base" | "lg";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "base",
  className = "",
  onClick,
  type = "button",
  disabled = false,
  loading = false,
}: ButtonProps) {
  // Use getFontClasses for consistent typography
  const buttonFont =
    size === "sm"
      ? fontPresets["button-sm"]
      : size === "lg"
        ? fontPresets["button-lg"]
        : fontPresets.button;

  const baseClasses =
    "inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-forest text-white hover:bg-forest/90 focus:ring-forest border border-transparent shadow-sm hover:shadow-md",
    secondary:
      "bg-warmWhite text-deepCharcoal hover:bg-gray-100 focus:ring-forest border border-lightGrey shadow-sm hover:shadow-md",
    outline:
      "bg-transparent text-forest hover:bg-forest/10 focus:ring-forest border border-forest",
    ghost:
      "bg-transparent text-forest hover:bg-forest/10 focus:ring-forest border border-transparent",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 gap-1.5",
    base: "px-4 py-2 gap-2",
    lg: "px-6 py-3 gap-2.5",
  };

  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    buttonFont,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

export default Button;
