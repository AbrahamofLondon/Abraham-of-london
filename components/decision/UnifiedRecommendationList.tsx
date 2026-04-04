// components/decision/UnifiedRecommendationList.tsx
"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import type { CanonicalRecommendation } from "@/lib/decision/canonical-sections";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function UnifiedRecommendationList({
  items,
  title = "Recommendations",
  emptyText = "No governed recommendations available.",
  variant = "dark",
}: {
  items: CanonicalRecommendation[];
  title?: string;
  emptyText?: string;
  variant?: "dark" | "light";
}) {
  const panelClass =
    variant === "dark"
      ? "border-white/[0.08] bg-white/[0.03] text-white"
      : "border-neutral-200 bg-neutral-50 text-neutral-900";

  const subtleClass =
    variant === "dark" ? "text-white/60" : "text-neutral-500";

  return (
    <div>
      <div
        className={cx(
          "mb-4 font-mono text-[10px] uppercase tracking-[0.24em]",
          variant === "dark" ? "text-[#E6D1A1]" : "text-neutral-500"
        )}
      >
        {title}
      </div>

      {items.length === 0 ? (
        <div
          className={cx(
            "rounded-[20px] border p-5 text-sm",
            panelClass,
            subtleClass
          )}
        >
          {emptyText}
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item, idx) => (
            <div
              key={item.id || `${idx}-${item.title}`}
              className={cx("rounded-[20px] border p-5", panelClass)}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className={cx("text-[10px] uppercase tracking-[0.18em] font-mono", subtleClass)}>
                    #{idx + 1} · {item.kind}
                  </div>
                  <div className="mt-2 text-lg font-medium">{item.title}</div>
                </div>

                <div className={cx("text-[11px] font-mono", subtleClass)}>
                  {item.score.toFixed(1)}
                </div>
              </div>

              <p className={cx("mt-3 text-sm leading-7", subtleClass)}>
                {item.summary}
              </p>

              {item.reasons?.length ? (
                <div className="mt-4 space-y-1.5">
                  {item.reasons.map((reason) => (
                    <div
                      key={`${item.id}-${reason}`}
                      className={cx("text-[12px] leading-6", subtleClass)}
                    >
                      • {reason}
                    </div>
                  ))}
                </div>
              ) : null}

              {item.href ? (
                <div className="mt-4">
                  <a
                    href={item.href}
                    className={cx(
                      "inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em]",
                      variant === "dark"
                        ? "text-[#E6D1A1] hover:text-[#F0E6C8]"
                        : "text-neutral-700 hover:text-black"
                    )}
                  >
                    Open asset
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}