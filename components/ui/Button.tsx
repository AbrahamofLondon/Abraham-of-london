// components/ui/Button.tsx
import * as React from "react";
import clsx from "clsx";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  href?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "color" | "href"> &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "color" | "href">;

const variantCls: Record<Variant, string> = {
  primary:
    "rounded-full bg-forest text-white hover:bg-forest/90 focus-visible:ring-forest/30",
  secondary:
    "rounded-full border border-lightGrey bg-white text-deepCharcoal hover:bg-warmWhite focus-visible:ring-deepCharcoal/30",
  ghost:
    "rounded-full text-deepCharcoal hover:bg-warmWhite border border-transparent focus-visible:ring-deepCharcoal/20",
};

const sizeCls: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
  ...rest
}: Props) {
  const classes = clsx(
    "inline-flex items-center justify-center font-medium outline-none transition",
    "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
    "disabled:opacity-60 disabled:cursor-not-allowed",
    variantCls[variant],
    sizeCls[size],
    className
  );

  if (href) {
    const isExternal =
      /^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
    if (isExternal) {
      return (
        <a href={href} className={classes} {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
          {children}
        </a>
      );
    }
    // Internal route → Next Link
    return (
      <Link href={href} className={classes} {...(rest as any)}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
