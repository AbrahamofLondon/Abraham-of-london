// components/decision/UnifiedRecommendationCard.tsx
"use client";

import * as React from "react";
import {
  ArrowUpRight,
  ClipboardList,
  FileText,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type UnifiedRecommendationCardData = {
  id: string;
  title: string;
  href?: string | null;
  kind: string;
  score: number;
  summary: string;
  reasons: string[];
};

export function UnifiedRecommendationCard({
  item,
  rank,
  variant = "dark",
  className,
}: {
  item: UnifiedRecommendationCardData;
  rank?: number;
  variant?: "dark" | "light";
  className?: string;
}) {
  const Icon =
    item.kind.toLowerCase().includes("diagnostic")
      ? ClipboardList
      : item.kind.toLowerCase().includes("framework")
      ? Layers3
      : item.kind.toLowerCase().includes("governance")
      ? ShieldCheck
      : FileText;

  const wrapperClass =
    variant === "dark"
      ? "border-white/[0.08] bg-white/[0.03] hover:border-[#C9A96A]/20 hover:bg-white/[0.05]"
      : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50";

  const titleClass = variant === "dark" ? "text-white" : "text-neutral-900";
  const bodyClass = variant === "dark" ? "text-white/60" : "text-neutral-600";
  const metaClass = variant === "dark" ? "text-white/40" : "text-neutral-400";
  const badgeClass =
    variant === "dark"
      ? "border-[#C9A96A]/20 bg-[#C9A96A]/10 text-[#E6D1A1]"
      : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <article
      className={cx(
        "rounded-[22px] border p-5 transition-all duration-200",
        wrapperClass,
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className={cx("flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em]", metaClass)}>
            {typeof rank === "number" ? <span>#{rank}</span> : null}
            <span>{item.kind}</span>
          </div>

          <div className="mt-3 flex items-start gap-3">
            <div
              className={cx(
                "mt-0.5 rounded-full border p-2",
                variant === "dark"
                  ? "border-white/[0.08] bg-black/20 text-[#E6D1A1]"
                  : "border-neutral-200 bg-neutral-50 text-amber-700"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className={cx("text-lg font-medium tracking-tight", titleClass)}>
                {item.title}
              </h3>
              <p className={cx("mt-2 text-sm leading-7", bodyClass)}>
                {item.summary}
              </p>
            </div>
          </div>
        </div>

        <div
          className={cx(
            "rounded-full border px-3 py-1 text-[11px] font-mono",
            badgeClass
          )}
        >
          {item.score.toFixed(1)}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.reasons.map((reason) => (
          <span
            key={reason}
            className={cx(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]",
              variant === "dark"
                ? "border-white/[0.08] bg-white/[0.02] text-white/58"
                : "border-neutral-200 bg-neutral-50 text-neutral-600"
            )}
          >
            <Sparkles className="h-3 w-3" />
            {reason}
          </span>
        ))}
      </div>

      {item.href ? (
        <div className="mt-4">
          <a
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className={cx(
              "inline-flex items-center gap-2 text-sm",
              variant === "dark"
                ? "text-[#E6D1A1] hover:text-[#F0E6C8]"
                : "text-amber-700 hover:text-amber-800"
            )}
          >
            Open recommendation
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      ) : null}
    </article>
  );
}