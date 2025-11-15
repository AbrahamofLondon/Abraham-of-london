// components/ui/InteractiveElement.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils"; // Assuming you have a cn utility

type ButtonVariant = 
  | "primary" 
  | "secondary" 
  | "outline" 
  | "ghost" 
  | "danger" 
  | "success" 
  | "warning";

type ButtonSize = "sm" | "md" | "lg" | "xl";

// Removed unused ElementType import

interface BaseInteractiveProps {
  // Styling
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  
  // States
  disabled?: boolean;
  loading?: boolean;
  active?: boolean;
  
  // Content
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  
  // Interactive
  onClick?: (event: React.MouseEvent) => void;
  onHover?: (hovered: boolean) => void;
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
  
  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: string;
  tabIndex?: number;
}

type ButtonProps = BaseInteractiveProps & {
  as?: "button";
  type?: "button" | "submit" | "reset";
};

type LinkProps = BaseInteractiveProps & {
  as: "a";
  href: string;
  target?: string;
  rel?: string;
};

type DivProps = BaseInteractiveProps & {
  as: "div" | "span";
};

type InteractiveElementProps = ButtonProps | LinkProps | DivProps;

const InteractiveElement = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement | HTMLDivElement,
  InteractiveElementProps
>((props, ref) => {
  const {
    as = "button",
    variant = "primary",
    size = "md",
    className,
    disabled = false,
    loading = false,
    active = false,
    children,
    leftIcon,
    rightIcon,
    onClick,
    onHover,
    onFocus,
    onBlur,
    ariaLabel,
    ariaDescribedBy,
    role,
    tabIndex,
    ...rest
  } = props;

  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  // Variant styles
  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800 border border-transparent",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 active:bg-gray-800 border border-transparent",
    outline: "bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 active:bg-gray-100",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-blue-500 active:bg-gray-200 border border-transparent",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800 border border-transparent",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 active:bg-green-800 border border-transparent",
    warning: "bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500 active:bg-yellow-700 border border-transparent",
  };

  // Size styles
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm font-medium rounded-md gap-1.5",
    md: "px-4 py-2 text-base font-medium rounded-md gap-2",
    lg: "px-6 py-3 text-lg font-semibold rounded-lg gap-2.5",
    xl: "px-8 py-4 text-xl font-semibold rounded-lg gap-3",
  };

  // Icon sizes
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-7 h-7",
  };

  // Base styles
  const baseStyles = cn(
    "inline-flex items-center justify-center transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "active:scale-95",
    variantStyles[variant],
    sizeStyles[size],
    {
      "opacity-60 cursor-not-allowed": disabled || loading,
      "ring-2 ring-offset-2": isFocused,
      "scale-105": isHovered && !disabled && !loading,
      "ring-2 ring-blue-500 ring-offset-2": active,
    },
    className
  );

  // Handle interactions
  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover?.(false);
  };

  const handleFocus = (event: React.FocusEvent) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  const handleClick = (event: React.MouseEvent) => {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  // Loading spinner
  const LoadingSpinner = () => (
    <div className={cn("animate-spin rounded-full border-2 border-current border-t-transparent", iconSizes[size])} />
  );

  // Common props
  const commonProps = {
    className: baseStyles,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onClick: handleClick,
    "aria-label": ariaLabel,
    "aria-describedby": ariaDescribedBy,
    role,
    tabIndex: disabled ? -1 : tabIndex,
  };

  // Render based on element type
  if (as === "a") {
    const { href, target, rel } = rest as LinkProps;
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={disabled ? undefined : href}
        target={target}
        rel={rel}
        {...commonProps}
      >
        {loading && <LoadingSpinner />}
        {!loading && leftIcon && <span className={iconSizes[size]}>{leftIcon}</span>}
        <span className={loading ? "opacity-0" : "opacity-100"}>{children}</span>
        {!loading && rightIcon && <span className={iconSizes[size]}>{rightIcon}</span>}
      </a>
    );
  }

  if (as === "button") {
    const { type = "button" } = rest as ButtonProps;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        disabled={disabled || loading}
        {...commonProps}
      >
        {loading && <LoadingSpinner />}
        {!loading && leftIcon && <span className={iconSizes[size]}>{leftIcon}</span>}
        <span className={cn({ "opacity-0": loading })}>{children}</span>
        {!loading && rightIcon && <span className={iconSizes[size]}>{rightIcon}</span>}
      </button>
    );
  }

  // Div or Span
  const Element = as;
  return (
    <Element
      ref={ref as React.Ref<HTMLDivElement>}
      {...commonProps}
    >
      {loading && <LoadingSpinner />}
      {!loading && leftIcon && <span className={iconSizes[size]}>{leftIcon}</span>}
      <span className={cn({ "opacity-0": loading })}>{children}</span>
      {!loading && rightIcon && <span className={iconSizes[size]}>{rightIcon}</span>}
    </Element>
  );
});

InteractiveElement.displayName = "InteractiveElement";

export default InteractiveElement;