// components/CanonReference.tsx
import * as React from "react";

type CanonReferenceProps = {
  label: string;
  description?: string;
};

export default function CanonReference({
  label,
  description,
}: CanonReferenceProps): JSX.Element {
  return (
    <div
      className="
        mt-3 rounded-lg border
        border-slate-300/70 bg-slate-50/80
        px-3 py-2 text-sm
        dark:border-slate-700/80 dark:bg-slate-900/80
      "
    >
      <div className="font-semibold tracking-wide text-slate-900 dark:text-slate-50">
        {label}
      </div>
      {description ? (
        <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
          {description}
        </p>
      ) : null}
    </div>
  );
}