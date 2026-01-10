// components/ui/InteractiveElement.tsx
import * as React from "react";

export type InteractiveElementTag = "button" | "a" | "div";

export type InteractiveVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "success"
  | "outline";

export type InteractiveSize = "sm" | "md" | "lg";

export interface InteractiveElementProps
  extends React.HTMLAttributes<HTMLElement> {
  /**
   * Underlying element type. Defaults to "button".
   */
  as?: InteractiveElementTag;

  /**
   * Optional href when rendering as an anchor.
   */
  href?: string;

  /**
   * Disable interactions (adds aria-disabled + prevents click).
   */
  disabled?: boolean;

  /**
   * Visual variant - mapped into Tailwind classes.
   */
  variant?: InteractiveVariant;

  /**
   * Size token - mapped into padding / text-size.
   */
  size?: InteractiveSize;
}

/**
 * Lightweight polymorphic interactive wrapper.
 * Lets you render a button / anchor / div with consistent styling.
 *
 * Styling is intentionally conservative and should not clash
 * with your existing design system.
 */
const InteractiveElement = React.forwardRef<
  HTMLElement,
  InteractiveElementProps
>((props, ref) => {
  const {
    as = "button",
    href,
    disabled,
    className = "",
    children,
    onClick,
    variant = "primary",
    size = "md",
    ...rest
  } = props;

  // --- Variant styles -------------------------------------------------------
  const variantClasses = (() => {
    switch (variant) {
      case "secondary":
        return "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50";
      case "ghost":
        return "border border-transparent bg-transparent text-gray-700 hover:bg-gray-100";
      case "success":
        return "border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700";
      case "outline":
        return "border border-gray-400 bg-transparent text-gray-800 hover:bg-gray-50";
      case "primary":
      default:
        return "border border-softGold bg-softGold text-deepCharcoal hover:bg-softGold/90";
    }
  })();

  // --- Size styles ----------------------------------------------------------
  const sizeClasses = (() => {
    switch (size) {
      case "sm":
        return "px-3 py-1.5 text-xs";
      case "lg":
        return "px-6 py-3 text-sm";
      case "md":
      default:
        return "px-4 py-2 text-sm";
    }
  })();

  const baseClasses =
    "inline-flex items-center justify-center rounded-full font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-softGold/70 disabled:opacity-60 disabled:cursor-not-allowed";

  const combinedClassName = [
    baseClasses,
    variantClasses,
    sizeClasses,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const commonProps = {
    ...rest,
    ref,
    className: combinedClassName,
    "aria-disabled": disabled || undefined,
  };

  // --- Element implementations ---------------------------------------------

  if (as === "a") {
    return (
      <a
        {...(commonProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        href={href}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }
          if (onClick) {
            onClick(event as React.MouseEvent<HTMLElement>);
          }
        }}
      >
        {children}
      </a>
    );
  }

  if (as === "div") {
    return (
      <div
        {...(commonProps as React.HTMLAttributes<HTMLDivElement>)}
        role="button"
        onClick={(event) => {
          if (disabled) return;
          if (onClick) {
            onClick(event as React.MouseEvent<HTMLElement>);
          }
        }}
      >
        {children}
      </div>
    );
  }

  // default: button
  return (
    <button
      {...(commonProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      type={
        (rest as React.ButtonHTMLAttributes<HTMLButtonElement>).type ?? "button"
      }
      disabled={disabled}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        if (onClick) {
          onClick(event as React.MouseEvent<HTMLElement>);
        }
      }}
    >
      {children}
    </button>
  );
});

InteractiveElement.displayName = "InteractiveElement";

export default InteractiveElement;

