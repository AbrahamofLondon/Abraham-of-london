import * as React from "react";

type Props = React.PropsWithChildren<{ tone?: "default" | "gold" | "muted" }>;

export default function Badge({ tone = "default", children }: Props) {
  const bg =
    tone === "gold" ? "#D4AF37" :
    tone === "muted" ? "#e5e7eb" :
    "#111827";
  const fg = tone === "gold" ? "#111827" : "#ffffff";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.25rem 0.5rem",
        borderRadius: "9999px",
        background: bg,
        color: fg,
        fontSize: 12,
        lineHeight: 1.2,
        marginRight: 8,
      }}
    >
      {children}
    </span>
  );
}