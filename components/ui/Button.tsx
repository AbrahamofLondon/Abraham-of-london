import * as React from "react";
import Link from "next/link";
import clsx from "clsx";

type ButtonBaseProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

type ButtonLinkProps = ButtonBaseProps & {
  href: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

type ButtonProps = ButtonBaseProps | ButtonLinkProps;

const variantCls = {
  primary:
    "bg-forest text-white hover:bg-forest/90 focus-visible:ring-forest/30",
  secondary:
    "border border-lightGrey bg-white text-deepCharcoal hover:bg-warmWhite focus-visible:ring-deepCharcoal/20",
  ghost:
    "text-deepCharcoal/80 hover:text-deepCharcoal hover:bg-warmWhite focus-visible:ring-deepCharcoal/20",
};

const sizeCls = {
  sm: "px-3 py-1.5 text-xs rounded-full",
  md: "px-4 py-2 text-sm rounded-full",
  lg: "px-5 py-2.5 text-base rounded-full",
};

export default function Button(props: ButtonProps) {
  const {
    children,
    className,
    variant = "primary",
    size = "md",
    ariaLabel,
    ...rest
  } = props as any;

  const classes = clsx(
    "inline-flex items-center justify-center font-medium outline-none transition focus-visible:ring-2",
    variantCls[variant],
    sizeCls[size],
    className
  );

  if ("href" in props && props.href) {
    const { href, ...aRest } = rest;
    return (
      <Link href={href} className={classes} aria-label={ariaLabel} {...(aRest as any)}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} aria-label={ariaLabel} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
