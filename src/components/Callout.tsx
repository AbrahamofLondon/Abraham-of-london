import * as React from "react";

export type CalloutVariant = "note" | "warning" | "danger" | "info" | "success";

export interface CalloutProps extends React.PropsWithChildren {
  title?: string;
  variant?: CalloutVariant;
  className?: string;
  [key: string]: unknown;
}

const variantConfig: Record<
  CalloutVariant,
  { label: string; icon: string; border: string; bg: string; text: string }
> = {
  note: {
    label: "Note",
    icon: "✳️",
    border: "border-softGold/60",
    bg: "bg-softGold/10",
    text: "text-cream",
  },
  warning: {
    label: "Warning",
    icon: "⚠️",
    border: "border-amber-400/70",
    bg: "bg-amber-500/10",
    text: "text-amber-50",
  },
  danger: {
    label: "Caution",
    icon: "⛔",
    border: "border-red-500/70",
    bg: "bg-red-500/10",
    text: "text-red-50",
  },
  info: {
    label: "Insight",
    icon: "💡",
    border: "border-sky-400/70",
    bg: "bg-sky-500/10",
    text: "text-sky-50",
  },
  success: {
    label: "Focus",
    icon: "✅",
    border: "border-emerald-400/70",
    bg: "bg-emerald-500/10",
    text: "text-emerald-50",
  },
};

const Callout: React.FC<CalloutProps> = ({
  title,
  variant = "note",
  className,
  children,
}) => {
  const cfg = variantConfig[variant] ?? variantConfig.note;

  return (
    <aside
      className={[
        "my-6 rounded-2xl border px-4 py-4 sm:px-5 sm:py-5",
        "backdrop-blur-sm",
        cfg.bg,
        cfg.border,
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-xl">{cfg.icon}</div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span
              className={[
                "text-[0.7rem] font-semibold uppercase tracking-[0.2em]",
                cfg.text,
              ].join(" ")}
            >
              {title ?? cfg.label}
            </span>
          </div>
          <div className="text-sm leading-relaxed text-gray-200">
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Callout;