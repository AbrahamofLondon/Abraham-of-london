// src/components/Callout.tsx
import * as React from "react";

export type CalloutVariant = "info" | "warning" | "danger" | "success" | "note";

export interface CalloutProps {
  title?: string;
  variant?: CalloutVariant;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  [key: string]: unknown; // tolerate extra MDX props
}

const VARIANT_STYLES: Record<CalloutVariant, string> = {
  info: "border-sky-500/70 bg-sky-950/40",
  warning: "border-amber-500/80 bg-amber-950/40",
  danger: "border-red-500/80 bg-red-950/40",
  success: "border-emerald-500/80 bg-emerald-950/40",
  note: "border-softGold/70 bg-softGold/5",
};

const VARIANT_ICON: Record<CalloutVariant, string> = {
  info: "💡",
  warning: "⚠️",
  danger: "⛔",
  success: "✅",
  note: "✳️",
};

export default function Callout({
  title,
  variant = "note",
  children,
  icon,
  className,
  ...rest
}: CalloutProps): JSX.Element {
  const base = VARIANT_STYLES[variant] ?? VARIANT_STYLES.note;
  const resolvedIcon = icon ?? VARIANT_ICON[variant] ?? VARIANT_ICON.note;

  return (
    <div
      className={[
        "my-6 rounded-2xl border px-4 py-4 sm:px-5 sm:py-5",
        "backdrop-blur-sm shadow-[0_20px_40px_rgba(0,0,0,0.55)]",
        base,
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-xl sm:text-2xl">{resolvedIcon}</div>
        <div className="space-y-1">
          {title && (
            <h3 className="font-semibold text-cream text-sm sm:text-base">
              {title}
            </h3>
          )}
          <div className="text-sm leading-relaxed text-gray-100 sm:text-[0.95rem]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
