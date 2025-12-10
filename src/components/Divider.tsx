// src/components/Divider.tsx
import * as React from "react";

export interface DividerProps {
  label?: string;
  className?: string;
  [key: string]: unknown;
}

export default function Divider({
  label,
  className,
  ...rest
}: DividerProps): JSX.Element {
  if (!label) {
    return (
      <hr
        className={[
          "my-10 border-t border-gray-700/70",
          "mx-auto max-w-3xl",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      />
    );
  }

  return (
    <div
      className={[
        "my-10 flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-gray-400",
        "mx-auto max-w-3xl",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <span className="h-px flex-1 bg-gray-700/80" />
      <span className="whitespace-nowrap">{label}</span>
      <span className="h-px flex-1 bg-gray-700/80" />
    </div>
  );
}