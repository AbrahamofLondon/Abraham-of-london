// components/GlossaryTerm.tsx
import * as React from "react";

type GlossaryTermProps = {
  term: string;
  code?: string;
  children: React.ReactNode;
};

export default function GlossaryTerm({
  term,
  code,
  children,
}: GlossaryTermProps): JSX.Element {
  return (
    <section
      className="
        mt-4 rounded-xl border
        border-slate-300/70 bg-slate-50/90
        px-4 py-3 shadow-sm
        dark:border-slate-700/80 dark:bg-slate-900/85
      "
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-50 sm:text-base">
          {term}
        </h3>
        {code ? (
          <span
            className="
              rounded-full px-2.5 py-0.5 text-xs font-semibold
              bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30
              dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/40
            "
          >
            {code}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
        {children}
      </p>
    </section>
  );
}
