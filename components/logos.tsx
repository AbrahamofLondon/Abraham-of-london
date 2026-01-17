"use client";

import * as React from "react";

/**
 * Abraham of London — World-class logo system
 * - exactOptionalPropertyTypes-safe
 * - no undefined passed to optional props
 * - unique <defs> ids per instance
 */

// ---------------------------------------------
// Types
// ---------------------------------------------
type LogoProps = Omit<React.SVGProps<SVGSVGElement>, "children"> & {
  title?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean;
};

type LogoBaseProps = LogoProps & { children: React.ReactNode };

// ---------------------------------------------
// Helpers
// ---------------------------------------------
function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

function useStableIds(prefix: string) {
  const id = React.useId().replace(/:/g, "");
  return (name: string) => `${prefix}-${name}-${id}`;
}

/**
 * LogoBase:
 * - If aria-hidden === true => decorative
 * - Else exposes role="img" and aria-label derived from aria-label || title || default
 * - exactOptionalPropertyTypes-safe: never assigns undefined to optional props
 */
function LogoBase({
  title,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
  className,
  children,
  ...props
}: LogoBaseProps) {
  const svgProps: React.SVGProps<SVGSVGElement> = {
    xmlns: "http://www.w3.org/2000/svg",
    className: cx(
      "select-none",
      "transition-[opacity,transform,filter] duration-300",
      "motion-reduce:transition-none",
      className
    ),
    focusable: false,
    ...props,
  };

  if (ariaHidden === true) {
    svgProps["aria-hidden"] = true;
  } else {
    svgProps.role = "img";
    svgProps["aria-label"] = ariaLabel ?? title ?? "Abraham of London";
  }

  return (
    <svg {...svgProps}>
      {title && ariaHidden !== true ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

// ---------------------------------------------
// Brand primitives
// ---------------------------------------------
const BRAND = {
  goldA: "#E6D5A5",
  goldB: "#D4AF37",
  goldC: "#B8860B",
  platinumA: "#F5F5F5",
  platinumB: "#C0C0C0",
  ink: "#0B0B0D",
} as const;

const ESTABLISHED_YEAR = "MMXVIII";

// ---------------------------------------------
// 1) MONOGRAM
// ---------------------------------------------
export function LogoMonogram(props: LogoProps) {
  const { title, className, ...rest } = props;
  const gid = useStableIds("aol-monogram");

  const gold = gid("gold");
  const platinum = gid("platinum");
  const shadow = gid("shadow");
  const sheen = gid("sheen");

  return (
    <LogoBase
      title={title ?? "Abraham of London"}
      viewBox="0 0 120 120"
      className={cx(
        "will-change-transform",
        "hover:scale-[1.02]",
        "active:scale-[0.99]",
        "motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        className
      )}
      {...rest}
    >
      <defs>
        <linearGradient id={gold} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={BRAND.goldA} />
          <stop offset="45%" stopColor={BRAND.goldB} />
          <stop offset="100%" stopColor={BRAND.goldC} />
        </linearGradient>

        <linearGradient id={platinum} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={BRAND.platinumA} />
          <stop offset="100%" stopColor={BRAND.platinumB} />
        </linearGradient>

        <radialGradient id={sheen} cx="25%" cy="20%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>

        <filter id={shadow} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.16" />
        </filter>
      </defs>

      <circle cx="60" cy="60" r="56" fill="none" stroke={`url(#${gold})`} strokeWidth="1" strokeOpacity="0.35" />
      <circle cx="60" cy="60" r="26" fill="none" stroke={`url(#${gold})`} strokeWidth="0.6" strokeOpacity="0.55" />

      <g filter={`url(#${shadow})`}>
        <path
          d="M60 28 L88 82 H77.5 L71.5 70 H48.5 L42.5 82 H32 L60 28 Z
             M60 49 L54.2 61 H65.8 L60 49 Z"
          fill={`url(#${platinum})`}
          stroke={`url(#${gold})`}
          strokeWidth="1.05"
          strokeLinejoin="round"
        />
      </g>

      <circle cx="60" cy="60" r="54" fill={`url(#${sheen})`} />

      <g opacity="0.65">
        <text
          x="60"
          y="111"
          textAnchor="middle"
          fontSize="8"
          fill={`url(#${gold})`}
          letterSpacing="1.5"
          style={{ fontFamily: "'Cormorant Garamond','Times New Roman',serif" }}
        >
          • LONDON •
        </text>
      </g>
    </LogoBase>
  );
}

// ---------------------------------------------
// 2) WORDMARK
// ---------------------------------------------
export function LogoWordmark(props: LogoProps) {
  const { title, className, ...rest } = props;
  const gid = useStableIds("aol-wordmark");

  const gold = gid("gold");
  const glow = gid("glow");

  return (
    <LogoBase
      title={title ?? "Abraham of London"}
      viewBox="0 0 520 90"
      className={cx("opacity-95 hover:opacity-100", className)}
      {...rest}
    >
      <defs>
        <linearGradient id={gold} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={BRAND.goldB} />
          <stop offset="50%" stopColor={BRAND.goldA} />
          <stop offset="100%" stopColor={BRAND.goldC} />
        </linearGradient>

        <filter id={glow} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 0.25 0"
            result="soft"
          />
          <feMerge>
            <feMergeNode in="soft" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter={`url(#${glow})`}>
        <text
          x="260"
          y="54"
          textAnchor="middle"
          fontSize="40"
          fontWeight="500"
          letterSpacing="0.12em"
          fill={`url(#${gold})`}
          style={{
            fontFamily: "'Cormorant Garamond','Times New Roman',serif",
            fontVariant: "small-caps",
          }}
        >
          ABRAHAM OF LONDON
        </text>

        <line
          x1="120"
          y1="64"
          x2="400"
          y2="64"
          stroke={`url(#${gold})`}
          strokeWidth="0.65"
          strokeOpacity="0.45"
          strokeLinecap="round"
        />

        <text
          x="260"
          y="82"
          textAnchor="middle"
          fontSize="9"
          letterSpacing="2.6"
          fill={`url(#${gold})`}
          opacity="0.45"
          style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Arial" }}
        >
          ESTABLISHED {ESTABLISHED_YEAR}
        </text>
      </g>
    </LogoBase>
  );
}

// ---------------------------------------------
// 3) FULL LOCKUP
// ---------------------------------------------
export function LogoFull({
  variant = "horizontal",
  monogramSize = 52,
  wordmarkWidth = 260,
  spacing = 18,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "horizontal" | "vertical";
  monogramSize?: number;
  wordmarkWidth?: number;
  spacing?: number;
}) {
  const { "aria-label": ariaLabel = "Abraham of London", "aria-hidden": ariaHidden, ...divProps } = props;

  const isVertical = variant === "vertical";
  const wordmarkHeight = Math.max(48, Math.round(monogramSize * 0.72));

  return (
    <div
      {...(ariaHidden === true ? { "aria-hidden": true } : { role: "img", "aria-label": ariaLabel })}
      className={cx(
        "inline-flex items-center justify-center",
        isVertical ? "flex-col" : "flex-row",
        className
      )}
      style={{ gap: `${spacing}px` }}
      {...divProps}
    >
      <LogoMonogram width={monogramSize} height={monogramSize} aria-hidden={true} />
      <LogoWordmark width={wordmarkWidth} height={wordmarkHeight} aria-hidden={true} />
    </div>
  );
}

// ---------------------------------------------
// 4) SEAL
// ---------------------------------------------
export function LogoSeal(props: LogoProps) {
  const { title, className, ...rest } = props;
  const gid = useStableIds("aol-seal");

  const gold = gid("gold");
  const textPathId = gid("textPath");
  const emboss = gid("emboss");

  return (
    <LogoBase
      title={title ?? "Abraham of London Seal"}
      viewBox="0 0 160 160"
      className={cx("opacity-95", className)}
      {...rest}
    >
      <defs>
        <linearGradient id={gold} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={BRAND.goldA} />
          <stop offset="50%" stopColor={BRAND.goldB} />
          <stop offset="100%" stopColor={BRAND.goldC} />
        </linearGradient>

        <filter id={emboss} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#000" floodOpacity="0.14" />
        </filter>

        <path
          id={textPathId}
          d="M80,80 m-60,0 a60,60 0 1,1 120,0 a60,60 0 1,1 -120,0"
          fill="none"
        />
      </defs>

      <circle cx="80" cy="80" r="76" fill="none" stroke={`url(#${gold})`} strokeWidth="1.1" />
      <circle cx="80" cy="80" r="68" fill="none" stroke={`url(#${gold})`} strokeWidth="0.7" strokeOpacity="0.55" />

      <g filter={`url(#${emboss})`}>
        <path
          d="M80 38 L103 84 H92.5 L87.3 73 H72.7 L67.5 84 H57 L80 38 Z
             M80 55 L74.7 66.2 H85.3 L80 55 Z"
          fill="none"
          stroke={`url(#${gold})`}
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>

      <text
        fill={`url(#${gold})`}
        fontSize="9"
        letterSpacing="1.4"
        opacity="0.78"
        style={{ fontFamily: "'Cormorant Garamond','Times New Roman',serif" }}
      >
        <textPath href={`#${textPathId}`} startOffset="50%" textAnchor="middle">
          • ABRAHAM OF LONDON • EST • {ESTABLISHED_YEAR} •
        </textPath>
      </text>

      <circle cx="80" cy="80" r="2.2" fill={`url(#${gold})`} />
    </LogoBase>
  );
}

// ---------------------------------------------
// 5) MARK
// ---------------------------------------------
export function LogoMark(props: LogoProps) {
  const { title, className, ...rest } = props;
  const gid = useStableIds("aol-mark");

  const gold = gid("gold");

  return (
    <LogoBase
      title={title ?? "Abraham of London"}
      viewBox="0 0 80 80"
      className={cx(
        "will-change-transform",
        "hover:scale-[1.03]",
        "active:scale-[0.99]",
        "motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        className
      )}
      {...rest}
    >
      <defs>
        <linearGradient id={gold} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={BRAND.goldB} />
          <stop offset="100%" stopColor={BRAND.goldC} />
        </linearGradient>
      </defs>

      <rect
        x="10"
        y="10"
        width="60"
        height="60"
        rx="8"
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth="0.8"
        strokeOpacity="0.35"
      />

      <path
        d="M40 22 L57 58 H50.8 L47.2 50.2 H32.8 L29.2 58 H23 L40 22 Z
           M40 36.2 L35.8 45.3 H44.2 L40 36.2 Z"
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      <path
        d="M52.5 58 H43.5 V39.5"
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth="1.1"
        strokeOpacity="0.55"
        strokeLinecap="round"
      />

      <text
        x="68"
        y="72"
        fontSize="6"
        fill={`url(#${gold})`}
        opacity="0.3"
        style={{ fontFamily: "'Cormorant Garamond','Times New Roman',serif" }}
        textAnchor="end"
      >
        {ESTABLISHED_YEAR}
      </text>
    </LogoBase>
  );
}

// ---------------------------------------------
// Export bundle
// ---------------------------------------------
const Logos = {
  LogoMonogram,
  LogoWordmark,
  LogoFull,
  LogoSeal,
  LogoMark,
} as const;

export default Logos;