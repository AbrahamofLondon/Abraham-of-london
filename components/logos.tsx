// components/logos.tsx
import * as React from "react";

type SvgProps = React.SVGProps<SVGSVGElement> & {
  title?: string;
};

interface SvgBaseProps extends SvgProps {
  children: React.ReactNode;
  "aria-label"?: string;
  "aria-hidden"?: boolean | "true" | "false";
}

function SvgBase({
  title,
  children,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
  focusable = "false",
  fill = "currentColor",
  ...props
}: SvgBaseProps) {
  // Determine the best accessibility approach
  const hasTitle = Boolean(title);
  const shouldBeHidden = ariaHidden === true || ariaHidden === "true";

  // Create proper accessibility props without type conflicts
  const accessibilityProps = shouldBeHidden
    ? { "aria-hidden": true as const } // Use boolean true
    : {
        "aria-label": ariaLabel || title,
        role: "img" as const,
      };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill={fill}
      focusable={focusable}
      {...accessibilityProps}
      {...props}
    >
      {/* Provide title for both accessibility and tooltips */}
      {hasTitle && !shouldBeHidden && <title>{title}</title>}
      {children}
    </svg>
  );
}

/**
 * Monogram — a premium, quiet-luxury "A" crest mark.
 * Uses currentColor so it inherits text color (e.g., deepCharcoal).
 */
export function LogoMonogram(props: SvgProps) {
  return (
    <SvgBase
      title={props.title ?? "Abraham of London — Monogram"}
      viewBox="0 0 64 64"
      {...props}
    >
      {/* Outer shield with subtle gradient effect */}
      <path
        d="M32 3c9.2 0 20 4.1 20 4.1s0 8.9-1.6 14.7C47.8 30.4 41 36.6 32 43.5c-9-6.9-15.8-13.1-18.4-21.7C12 16 12 7.1 12 7.1S22.8 3 32 3z"
        className="fill-current"
      />
      {/* Stylized A - main letterform */}
      <path
        d="M32 15l12 24h-6l-2.3-4.8h-7.4L26 39h-6L32 15zm0 8.8l-2.3 4.8h4.6L32 23.8z"
        className="fill-current"
      />
      {/* Crown hint (subtle) */}
      <path
        d="M22 12h20a1.5 1.5 0 0 1 0 3H22a1.5 1.5 0 0 1 0-3z"
        className="fill-current"
      />
    </SvgBase>
  );
}

/**
 * Wordmark — refined serif/smallcaps feel but rendered as vector paths,
 * so it stays sharp and brand-consistent.
 */
export function LogoWordmark(props: SvgProps) {
  return (
    <SvgBase
      title={props.title ?? "Abraham of London — Wordmark"}
      viewBox="0 0 320 64"
      {...props}
    >
      {/* "ABRAHAM OF LONDON" as vector paths (clean, mono-solid look) */}
      <g className="fill-current">
        {/* ABRAHAM */}
        <path d="M18 46l8-28h6l8 28h-5.6l-1.6-6H25.2l-1.7 6H18zm8.5-11h8l-4-14-4 14zM45 46V18h5v10.4h.2c1.3-1.8 3.6-3.2 6.7-3.2 5 0 8.1 3.7 8.1 9.1V46h-5v-10c0-3.5-1.8-5.8-5-5.8-3.1 0-5 2.5-5 5.8V46h-5zM73 46V18h5v3.6h.2c1.2-2.4 3.7-4 7-4 5.6 0 9.2 4.5 9.2 10.4 0 6.2-3.7 10.7-9.3 10.7-3 0-5.4-1.3-6.7-3.6H78V46h-5zm16.1-17.9c0-3.4-2.2-5.9-5.2-5.9s-5.2 2.5-5.2 5.9 2.2 6 5.2 6c3 0 5.2-2.6 5.2-6zM102 46l8-28h6l8 28h-5.6l-1.6-6h-9.6l-1.7 6H102zm8.5-11h8l-4-14-4 14z" />
        {/* OF */}
        <path d="M146 45.9c-6.7 0-11.4-4.9-11.4-11.9s4.7-12 11.4-12 11.4 5 11.4 12-4.7 12-11.4 12zm0-4.7c3.9 0 6.5-3 6.5-7.3s-2.6-7.4-6.5-7.4-6.5 3.1-6.5 7.4 2.6 7.3 6.5 7.3zM162 46V18h15v4.3h-10v5.8h8.6V32H167v10h-5z" />
        {/* LONDON */}
        <path d="M184 46V18h5v23.7h11.4V46H184zM203 32c0-7.1 4.5-12 11.1-12s11.1 4.9 11.1 12-4.5 12-11.1 12S203 39.1 203 32zm17.2 0c0-4.2-2.4-7.3-6.1-7.3s-6.1 3.1-6.1 7.3 2.4 7.3 6.1 7.3 6.1-3.1 6.1-7.3zM228 46V18h5v3.7h.2c1.1-2.4 3.6-3.7 6.6-3.7 5.5 0 9.1 4.5 9.1 10.4 0 6.1-3.6 10.7-9.2 10.7-3 0-5.4-1.3-6.5-3.6H233V46h-5zm15.7-14c0-3.4-2.2-5.9-5.2-5.9s-5.2 2.5-5.2 5.9 2.2 6 5.2 6c3 0 5.2-2.6 5.2-6zM254 32c0-7.1 4.5-12 11.1-12s11.1 4.9 11.1 12-4.5 12-11.1 12S254 39.1 254 32zm17.2 0c0-4.2-2.4-7.3-6.1-7.3s-6.1 3.1-6.1 7.3 2.4 7.3 6.1 7.3 6.1-3.1 6.1-7.3z" />
      </g>
    </SvgBase>
  );
}

/** Full lockup: monogram + wordmark (nice for header) */
export function LogoFull({
  gap = 10,
  monogramProps = {},
  wordmarkProps = {},
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  gap?: number;
  monogramProps?: SvgProps;
  wordmarkProps?: SvgProps;
}) {
  const {
    "aria-label": ariaLabel = "Abraham of London",
    "aria-hidden": ariaHidden,
    ...divProps
  } = props;

  return (
    <div
      aria-label={ariaHidden ? undefined : ariaLabel}
      aria-hidden={ariaHidden}
      className={`inline-flex items-center ${className}`}
      style={{ color: "currentColor" }}
      {...divProps}
    >
      <LogoMonogram
        width={28}
        height={28}
        aria-hidden={true} // Fix: Use boolean instead of string
        {...monogramProps}
      />
      <span style={{ width: gap }} aria-hidden="true" />
      <LogoWordmark
        width={190}
        height={38}
        aria-hidden={true} // Fix: Use boolean instead of string
        {...wordmarkProps}
      />
    </div>
  );
}

/**
 * Compact version for mobile or tight spaces
 */
export function LogoCompact(props: SvgProps) {
  return (
    <SvgBase
      title={props.title ?? "Abraham of London — Compact"}
      viewBox="0 0 120 64"
      {...props}
    >
      <g className="fill-current">
        {/* Monogram adapted for compact version */}
        <path d="M12 3c6.9 0 15 3.1 15 3.1s0 6.7-1.2 11c-2.3 6-7.4 10.5-13.8 15.4-6.4-4.9-11.5-9.4-13.8-15.4C-3 12.8-3 6.2-3 6.2S5.1 3 12 3z" />
        <path d="M12 11.2l9 18h-4.5l-1.7-3.6H17l-1.7 3.6H12l9-18zm0 6.6l-1.7 3.6h3.4L12 17.8z" />
        <path d="M5 9h14a1.1 1.1 0 0 1 0 2.2H5a1.1 1.1 0 0 1 0-2.2z" />

        {/* Compact wordmark */}
        <path d="M32 46V18h3.8v23.7h8.6V46H32zM45.3 32c0-5.3 3.4-9 8.3-9s8.3 3.7 8.3 9-3.4 9-8.3 9-8.3-3.7-8.3-9zm12.9 0c0-3.2-1.8-5.5-4.6-5.5s-4.6 2.3-4.6 5.5 1.8 5.5 4.6 5.5 4.6-2.3 4.6-5.5zM68 46V18h3.8v3.7h.2c.8-1.8 2.7-2.8 5-2.8 4.1 0 6.8 3.4 6.8 7.8 0 4.6-2.7 8-6.9 8-2.3 0-4-1-4.9-2.7H72V46h-4zm11.8-10.5c0-2.6-1.7-4.4-3.9-4.4s-3.9 1.9-3.9 4.4 1.7 4.5 3.9 4.5 3.9-1.9 3.9-4.5z" />
      </g>
    </SvgBase>
  );
}

/**
 * Icon-only version for favicon, social media, etc.
 */
export function LogoIcon(props: SvgProps) {
  return (
    <SvgBase
      title={props.title ?? "Abraham of London — Icon"}
      viewBox="0 0 64 64"
      {...props}
    >
      <path
        d="M32 2c10.1 0 22 4.5 22 4.5s0 9.8-1.8 16.2C49.6 33.4 42 40.3 32 47.8c-10-7.5-17.6-14.4-20.2-25.1C10 16.3 10 6.5 10 6.5S21.9 2 32 2z"
        className="fill-current"
      />
      <path
        d="M32 14l13.2 26.4h-6.6l-2.5-5.3h-8.2L25.4 40.4h-6.6L32 14zm0 9.7l-2.5 5.3h5l-2.5-5.3z"
        className="fill-current"
      />
      <path
        d="M20 10h22a1.7 1.7 0 0 1 0 3.4H20a1.7 1.7 0 0 1 0-3.4z"
        className="fill-current"
      />
    </SvgBase>
  );
}

// Create named export object
const Logos = {
  LogoMonogram,
  LogoWordmark,
  LogoFull,
  LogoCompact,
  LogoIcon,
};

// Export all logos for easy importing
export default Logos;