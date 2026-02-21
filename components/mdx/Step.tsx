// components/mdx/Step.tsx
import * as React from "react";

type StepProps = {
  // New preferred API (what your TSX expects)
  number?: number;
  title?: string;

  // Backward-compatible API (what your MDX currently uses)
  "data-number"?: string | number;

  children: React.ReactNode;
  className?: string;
};

function coerceNumber(val: unknown): number | undefined {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const n = Number(val.trim());
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export default function Step(props: StepProps) {
  const {
    children,
    className = "",
    title,
    number,
    "data-number": dataNumber,
    ...rest
  } = props;

  const n = coerceNumber(number ?? dataNumber);

  return (
    <div
      className={[
        "relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-7",
        className,
      ].join(" ")}
      {...rest}
    >
      <div className="flex gap-4">
        {typeof n !== "undefined" ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-sm">
            {n}
          </div>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 font-mono text-sm">
            •
          </div>
        )}

        <div className="flex-1">
          {title ? (
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-amber-200/70">
              {title}
            </div>
          ) : null}

          <div className="text-white/70 leading-relaxed [&_p]:my-0 [&_strong]:text-white/90">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}