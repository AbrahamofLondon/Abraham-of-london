// components/ui/InteractiveElement.tsx
import * as React from "react";
import Button from "@/components/ui/Button";

export type InteractiveElementTag = "button" | "a" | "div";
export type InteractiveVariant = "primary" | "secondary" | "ghost" | "success" | "outline";
export type InteractiveSize = "sm" | "md" | "lg";

type Props = {
  as?: InteractiveElementTag;
  href?: string;
  disabled?: boolean;
  variant?: InteractiveVariant;
  size?: InteractiveSize;
  className?: string;
  children: React.ReactNode;
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement> &
    React.AnchorHTMLAttributes<HTMLAnchorElement> &
    React.HTMLAttributes<HTMLDivElement>,
  "className" | "children"
>;

/**
 * LEGACY COMPAT WRAPPER
 * Route all interactive usage through the canonical Button.
 * - as="div" is supported but rendered as a button for accessibility consistency.
 */
export default function InteractiveElement({
  as = "button",
  href,
  disabled,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: Props) {
  // Map legacy variants into canonical ones
  const mappedVariant =
    variant === "outline" || variant === "success" ? "secondary" : (variant as "primary" | "secondary" | "ghost");

  // If it was a div, treat as button (keeps semantics consistent)
  if (as === "a" || href) {
    return (
      <Button
        href={href}
        variant={mappedVariant}
        size={size}
        className={className}
        aria-disabled={disabled || undefined}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </Button>
    );
  }

  return (
    <Button
      variant={mappedVariant}
      size={size}
      className={className}
      disabled={disabled}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </Button>
  );
}