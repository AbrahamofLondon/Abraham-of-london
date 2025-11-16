// components/ui/InteractiveElement.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "success" | "ghost";
type Size = "sm" | "md" | "lg";

export interface InteractiveElementProps {
  as?: "button" | "a" | "div";
  href?: string;

  variant?: Variant;
  size?: Size;
  loading?: boolean;

  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;

  onClick?: React.MouseEventHandler<HTMLElement>;
  children?: React.ReactNode;

  // Allow any extra DOM props without fighting TS
  [key: string]: unknown;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 border border-blue-600",
  outline:
    "bg-transparent text-gray-900 border border-gray-300 hover:bg-gray-50",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 border border-emerald-600",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-100 border border-transparent",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

const iconSizes: Record<Size, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-5 w-5",
};

const LoadingSpinner: React.FC = () => (
  <span
    className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent align-middle"
    aria-hidden="true"
  />
);

export function InteractiveElement(props: InteractiveElementProps): JSX.Element {
  const {
    as = "button",
    href,
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    className,
    type = "button",
    disabled,
    children,
    onClick,
    ...rest
  } = props;

  const Element: "button" | "a" | "div" =
    as === "a" || as === "div" ? as : "button";

  const isDisabled = Boolean(disabled || loading);

  const baseClasses =
    "inline-flex items-center justify-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const commonProps: Record<string, unknown> = {
    className: cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      isDisabled && "opacity-60 cursor-not-allowed",
      className
    ),
    onClick,
    "aria-busy": loading || undefined,
    "aria-disabled": isDisabled || undefined,
    ...rest,
  };

  if (Element === "button") {
    commonProps.type = type;
    commonProps.disabled = isDisabled;
  }

  if (Element === "a") {
    commonProps.href = href ?? "#";
  }

  return (
    <Element {...commonProps}>
      {loading && <LoadingSpinner />}

      {!loading && leftIcon && (
        <span className={cn(iconSizes[size], "mr-2")}>{leftIcon}</span>
      )}

      <span className="inline-flex items-center">{children}</span>

      {!loading && rightIcon && (
        <span className={cn(iconSizes[size], "ml-2")}>{rightIcon}</span>
      )}
    </Element>
  );
}

export default InteractiveElement;