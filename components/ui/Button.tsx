// components/ui/Button.tsx — CANONICAL (AoL Harrods-level tokens, Typed, Accessible)
import * as React from "react";
import clsx from "clsx";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;

  href?: string;
  target?: string;
  rel?: string;

  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  isLoading?: boolean;
  loadingText?: string;
};

type ButtonNativeProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;
type AnchorNativeProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href">;

type Props = BaseProps & (ButtonNativeProps | AnchorNativeProps);

// NOTE: these use your CSS variables + existing palette classes.
// If a token is missing, Tailwind falls back to literal values safely.
const variantCls: Record<Variant, string> = {
  // Premium “soft gold on charcoal” — anchor CTA
  primary: clsx(
    "bg-[color:var(--color-softGold)] text-[color:var(--color-deepCharcoal)]",
    "shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
    "hover:bg-[color:var(--color-softGold)/0.92]",
    "active:bg-[color:var(--color-softGold)/0.88]",
    "focus-visible:ring-[color:var(--color-softGold)/0.35]"
  ),

  // White panel / outline treatment — secondary CTA
  secondary: clsx(
    "border border-[color:var(--color-lightGrey)] bg-white text-[color:var(--color-deepCharcoal)]",
    "hover:bg-[color:var(--color-warmWhite)]",
    "focus-visible:ring-[color:var(--color-softGold)/0.22]"
  ),

  // Minimal “ink” hover — tertiary CTA
  ghost: clsx(
    "border border-transparent text-[color:var(--color-deepCharcoal)]",
    "hover:bg-[color:var(--color-warmWhite)]",
    "focus-visible:ring-[color:var(--color-softGold)/0.18]"
  ),
};

const sizeCls: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-sm",
};

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={clsx("h-4 w-4 animate-spin", className)} viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v2.5A5.5 5.5 0 006.5 12H4z" />
    </svg>
  );
}

export default function Button({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
  leftIcon,
  rightIcon,
  isLoading = false,
  loadingText,
  target,
  rel,
  ...rest
}: Props) {
  const disabled = isLoading || ("disabled" in (rest as any) ? Boolean((rest as any).disabled) : false);

  const classes = clsx(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium outline-none transition",
    "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
    "disabled:opacity-60 disabled:cursor-not-allowed",
    variantCls[variant],
    sizeCls[size],
    className
  );

  const content = (
    <>
      {isLoading ? <Spinner /> : leftIcon ? <span className="inline-flex">{leftIcon}</span> : null}
      <span className="inline-flex items-center">{isLoading && loadingText ? loadingText : children}</span>
      {!isLoading && rightIcon ? <span className="inline-flex">{rightIcon}</span> : null}
    </>
  );

  if (href) {
    const anchorProps = rest as AnchorNativeProps;
    const external = isExternalHref(href);
    const finalRel = rel ?? (target === "_blank" ? "noopener noreferrer" : undefined);

    if (external) {
      return (
        <a
          href={href}
          className={classes}
          target={target}
          rel={finalRel}
          aria-disabled={disabled || undefined}
          onClick={(e) => {
            if (disabled) {
              e.preventDefault();
              return;
            }
            anchorProps.onClick?.(e);
          }}
          {...anchorProps}
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        href={href}
        className={classes}
        aria-disabled={disabled || undefined}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          (anchorProps.onClick as any)?.(e);
        }}
        {...(anchorProps as any)}
      >
        {content}
      </Link>
    );
  }

  const buttonProps = rest as ButtonNativeProps;

  return (
    <button className={classes} type={buttonProps.type ?? "button"} disabled={disabled} {...buttonProps}>
      {content}
    </button>
  );
}