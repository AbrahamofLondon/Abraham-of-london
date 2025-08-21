import * as React from "react";

type SvgProps = React.SVGProps<SVGSVGElement> & { title?: string };

function SvgBase({ title, children, ...props }: SvgProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 320 64"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      focusable="false"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/**
 * Monogram — a premium, quiet-luxury “A” crest mark.
 * Uses currentColor so it inherits text color (e.g., deepCharcoal).
 */
export function LogoMonogram(props: SvgProps) {
  return (
    <SvgBase title={props.title ?? "Abraham of London — Monogram"} viewBox="0 0 64 64" {...props}>
      {/* Outer shield */}
      <path d="M32 3c9.2 0 20 4.1 20 4.1s0 8.9-1.6 14.7C47.8 30.4 41 36.6 32 43.5c-9-6.9-15.8-13.1-18.4-21.7C12 16 12 7.1 12 7.1S22.8 3 32 3z" />
      {/* Stylized A */}
      <path d="M32 15l12 24h-6l-2.3-4.8h-7.4L26 39h-6L32 15zm0 8.8l-2.3 4.8h4.6L32 23.8z" />
      {/* Crown hint (subtle) */}
      <path d="M22 12h20a1.5 1.5 0 0 1 0 3H22a1.5 1.5 0 0 1 0-3z" />
    </SvgBase>
  );
}

/**
 * Wordmark — refined serif/smallcaps feel but rendered as vector paths,
 * so it stays sharp and brand-consistent.
 */
export function LogoWordmark(props: SvgProps) {
  return (
    <SvgBase title={props.title ?? "Abraham of London — Wordmark"} viewBox="0 0 320 64" {...props}>
      {/* “ABRAHAM OF LONDON” as vector paths (clean, mono-solid look) */}
      {/* ABRAHAM */}
      <path d="M18 46l8-28h6l8 28h-5.6l-1.6-6H25.2l-1.7 6H18zm8.5-11h8l-4-14-4 14zM45 46V18h5v10.4h.2c1.3-1.8 3.6-3.2 6.7-3.2 5 0 8.1 3.7 8.1 9.1V46h-5v-10c0-3.5-1.8-5.8-5-5.8-3.1 0-5 2.5-5 5.8V46h-5zM73 46V18h5v3.6h.2c1.2-2.4 3.7-4 7-4 5.6 0 9.2 4.5 9.2 10.4 0 6.2-3.7 10.7-9.3 10.7-3 0-5.4-1.3-6.7-3.6H78V46h-5zm16.1-17.9c0-3.4-2.2-5.9-5.2-5.9s-5.2 2.5-5.2 5.9 2.2 6 5.2 6c3 0 5.2-2.6 5.2-6zM102 46l8-28h6l8 28h-5.6l-1.6-6h-9.6l-1.7 6H102zm8.5-11h8l-4-14-4 14z" />
      {/* OF */}
      <path d="M146 45.9c-6.7 0-11.4-4.9-11.4-11.9s4.7-12 11.4-12 11.4 5 11.4 12-4.7 12-11.4 12zm0-4.7c3.9 0 6.5-3 6.5-7.3s-2.6-7.4-6.5-7.4-6.5 3.1-6.5 7.4 2.6 7.3 6.5 7.3zM162 46V18h15v4.3h-10v5.8h8.6V32H167v10h-5z" />
      {/* LONDON */}
      <path d="M184 46V18h5v23.7h11.4V46H184zM203 32c0-7.1 4.5-12 11.1-12s11.1 4.9 11.1 12-4.5 12-11.1 12S203 39.1 203 32zm17.2 0c0-4.2-2.4-7.3-6.1-7.3s-6.1 3.1-6.1 7.3 2.4 7.3 6.1 7.3 6.1-3.1 6.1-7.3zM228 46V18h5v3.7h.2c1.1-2.4 3.6-3.7 6.6-3.7 5.5 0 9.1 4.5 9.1 10.4 0 6.1-3.6 10.7-9.2 10.7-3 0-5.4-1.3-6.5-3.6H233V46h-5zm15.7-14c0-3.4-2.2-5.9-5.2-5.9s-5.2 2.5-5.2 5.9 2.2 6 5.2 6c3 0 5.2-2.6 5.2-6zM254 32c0-7.1 4.5-12 11.1-12s11.1 4.9 11.1 12-4.5 12-11.1 12S254 39.1 254 32zm17.2 0c0-4.2-2.4-7.3-6.1-7.3s-6.1 3.1-6.1 7.3 2.4 7.3 6.1 7.3 6.1-3.1 6.1-7.3z" />
    </SvgBase>
  );
}

/** Full lockup: monogram + wordmark (nice for header) */
export function LogoFull({
  gap = 10,
  ...props
}: SvgProps & { gap?: number }) {
  return (
    <div
      aria-label="Abraham of London"
      className="inline-flex items-center"
      style={{ color: "currentColor" }}
    >
      <LogoMonogram width={28} height={28} aria-hidden="true" />
      <span style={{ width: gap }} aria-hidden="true" />
      <LogoWordmark width={190} height={38} aria-hidden="true" />
    </div>
  );
}
