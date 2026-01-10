// components/mdx/shortcodes.tsx
import * as React from "react";
import Link from "next/link";

/* ---------- Tiny helpers ---------- */
const cx = (...cls: (string | false | null | undefined)[]) =>
  cls.filter(Boolean).join(" ");

/* --- HeroEyebrow --- */
export function HeroEyebrow({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cx(
        "mb-3 inline-flex items-center gap-2 rounded-full border border-lightGrey/70 bg-warmWhite/70 px-3 py-1 text-xs uppercase tracking-wide text-[color:var(--color-on-secondary)/0.7]",
        className
      )}
    >
      {children}
    </div>
  );
}

/* --- Callout --- */
export type CalloutTone = "info" | "key" | "caution" | "success";

const toneStyles: Record<CalloutTone, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-100",
  key: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-100",
  caution:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-100",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-100",
};

export function Callout({
  title,
  tone = "info",
  children,
  className,
}: React.PropsWithChildren<{
  title?: string;
  tone?: CalloutTone;
  className?: string;
}>) {
  return (
    <div
      className={cx("my-4 rounded-xl border p-4 shadow-card", toneStyles[tone], className)}
    >
      {title ? (
        <div className="mb-2 font-semibold tracking-wide">{title}</div>
      ) : null}
      <div className="space-y-2 text-[0.95rem] leading-relaxed">{children}</div>
    </div>
  );
}

/* --- Badge --- */
export function Badge({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border border-lightGrey bg-warmWhite/70 px-2.5 py-1 text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

/* --- Rule (divider) --- */
export function Rule(props: React.HTMLAttributes<HTMLHRElement>) {
  return <hr className={cx("my-6 border-lightGrey", props.className)} />;
}

/* --- PullLine --- */
export function PullLine({
  subtle,
  children,
  className,
}: React.PropsWithChildren<{ subtle?: boolean; className?: string }>) {
  return (
    <p className={cx("pull-line", subtle && "opacity-90", className)}>
      {children}
    </p>
  );
}

/* --- Verse --- */
export function Verse({
  cite,
  children,
  className,
}: React.PropsWithChildren<{ cite?: string; className?: string }>) {
  return (
    <blockquote
      className={cx(
        "not-prose my-4 rounded-xl border border-lightGrey bg-warmWhite/70 p-4",
        className
      )}
    >
      <div className="text-[0.95rem] leading-relaxed">{children}</div>
      {cite ? (
        <div className="mt-2 text-right text-xs uppercase tracking-wide text-[color:var(--color-on-secondary)/0.7]">
          - {cite}
        </div>
      ) : null}
    </blockquote>
  );
}

/* --- Note (alias of Callout) --- */
export function Note(props: React.ComponentProps<typeof Callout>) {
  return <Callout tone={props.tone ?? "key"} {...props} />;
}

/* --- ResourcesCTA --- */
export function ResourcesCTA({
  title = "Resources",
  reads = [],
  downloads = [],
  className,
}: {
  title?: string;
  reads?: { href: string; label: string; sub?: string }[];
  downloads?: { href: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={cx("my-8 rounded-xl border border-lightGrey bg-warmWhite/70 p-5", className)}>
      <h3 className="mb-3 text-lg font-semibold text-forest">{title}</h3>

      {!!reads?.length && (
        <div className="mb-3">
          <div className="mb-1 text-sm font-medium uppercase tracking-wide text-[color:var(--color-on-secondary)/0.6]">
            Reading
          </div>
          <ul className="list-inside space-y-1">
            {reads.map((r, i) => (
              <li key={i} className="leading-snug">
                <Link href={r.href} className="luxury-link">
                  {r.label}
                </Link>
                {r.sub ? (
                  <span className="ml-2 text-xs text-[color:var(--color-on-secondary)/0.7]">
                    - {r.sub}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!!downloads?.length && (
        <div>
          <div className="mb-1 text-sm font-medium uppercase tracking-wide text-[color:var(--color-on-secondary)/0.6]">
            Downloads
          </div>
          <ul className="list-inside space-y-1">
            {downloads.map((d, i) => (
              <li key={i}>
                <Link href={d.href} className="aol-btn text-xs">
                  {d.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ✅ Export the object mdx-components.tsx expects                              */
/* -------------------------------------------------------------------------- */

export const shortcodes = {
  HeroEyebrow,
  Callout,
  Badge,
  Rule,
  PullLine,
  Verse,
  Note,
  ResourcesCTA,
} as const;

export default shortcodes;
