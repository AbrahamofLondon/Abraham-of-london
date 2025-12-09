// components/print/EmbossedSign.tsx
import * as React from "react";

type Props = {
  text?: string;
  className?: string;
};

export default function EmbossedSign({
  text = "Abraham of London",
  className = "",
}: Props) {
  return (
    <div
      className={[
        "select-none font-serif text-2xl tracking-wide text-gray-900/70",
        "relative inline-block",
        "print:text-gray-900",
        className,
      ].join(" ")}
      style={{
        textShadow:
          "0 1px 0 rgba(255,255,255,0.7), 0 -1px 0 rgba(0,0,0,0.15), 1px 0 0 rgba(255,255,255,0.5), -1px 0 0 rgba(0,0,0,0.1)",
      }}
    >
      {text}
    </div>
  );
}
