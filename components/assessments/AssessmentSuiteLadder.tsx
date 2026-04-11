// components/assessments/AssessmentSuiteLadder.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Crown, FileText, LayoutGrid, Radar, Users, ChevronRight } from "lucide-react";
import { ASSESSMENT_LADDER, type AssessmentId } from "@/lib/assessments/suite-registry";

const ICONS: Record<AssessmentId, React.ComponentType<{ className?: string }>> = {
  CONSTITUTIONAL: Radar,
  TEAM: Users,
  ENTERPRISE: LayoutGrid,
  EXECUTIVE_REPORTING: FileText,
};

// Step accent colours — each rung of the ladder is visually distinct
const STEP_PALETTE = [
  {
    border: "border-white/[0.09]",
    hoverBorder: "hover:border-white/[0.18]",
    iconColor: "text-white/50",
    numberColor: "text-white/20",
    accentBar: "bg-white/10",
    badge: "border-white/[0.08] bg-white/[0.03] text-white/40",
    cta: "text-white/55",
    glow: "",
  },
  {
    border: "border-white/[0.09]",
    hoverBorder: "hover:border-white/[0.18]",
    iconColor: "text-white/50",
    numberColor: "text-white/20",
    accentBar: "bg-white/10",
    badge: "border-white/[0.08] bg-white/[0.03] text-white/40",
    cta: "text-white/55",
    glow: "",
  },
  {
    border: "border-white/[0.09]",
    hoverBorder: "hover:border-white/[0.18]",
    iconColor: "text-white/50",
    numberColor: "text-white/20",
    accentBar: "bg-white/10",
    badge: "border-white/[0.08] bg-white/[0.03] text-white/40",
    cta: "text-white/55",
    glow: "",
  },
  {
    border: "border-amber-500/25",
    hoverBorder: "hover:border-amber-500/45",
    iconColor: "text-amber-400/80",
    numberColor: "text-amber-500/30",
    accentBar: "bg-amber-500/30",
    badge: "border-amber-500/20 bg-amber-500/[0.07] text-amber-300/80",
    cta: "text-amber-300/90",
    glow: "shadow-[0_0_60px_-20px_rgba(245,158,11,0.15)]",
  },
];

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function AssessmentSuiteLadder() {
  const [hovered, setHovered] = React.useState<string | null>(null);

  return (
    <div className="relative">
      {/* Connector line running through card centres on desktop */}
      <div className="pointer-events-none absolute left-[calc(50%_-_0.5px)] top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent lg:block" />

      <div className="grid gap-4 lg:grid-cols-4">
        {ASSESSMENT_LADDER.map((item, i) => {
          const Icon = ICONS[item.id];
          const pal = (STEP_PALETTE[i] ?? STEP_PALETTE[0])!;
          const isHovered = hovered === item.id;
          const isFlagship = i === ASSESSMENT_LADDER.length - 1;

          return (
            <Link
              key={item.id}
              href={item.href}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-[26px] border bg-black/50 backdrop-blur-sm",
                "transition-all duration-500",
                pal.border,
                pal.hoverBorder,
                pal.glow,
                isHovered && "translate-y-[-2px]",
              )}
            >
              {/* Top shimmer */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Flagship ambient glow */}
              {isFlagship && (
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.06),transparent_60%)]" />
              )}

              {/* Accent bar — left edge */}
              <div
                className={cn(
                  "absolute inset-y-0 left-0 w-[3px] rounded-r-full transition-all duration-500",
                  pal.accentBar,
                  isHovered ? "opacity-100" : "opacity-0",
                )}
              />

              <div className="relative z-10 flex flex-1 flex-col p-6">
                {/* Step number + icon row */}
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "font-mono text-[42px] font-light leading-none tracking-[-0.04em] transition-all duration-500",
                      pal.numberColor,
                      isHovered && "opacity-60",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>

                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03] transition-all duration-300",
                      isHovered && "border-white/[0.12] bg-white/[0.06]",
                    )}
                  >
                    <Icon className={cn("h-4.5 w-4.5 transition-colors duration-300", pal.iconColor)} />
                  </div>
                </div>

                {/* Position badge */}
                <div className="mt-5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.22em] transition-colors duration-300",
                      pal.badge,
                    )}
                  >
                    {item.position}
                  </span>
                </div>

                {/* Title */}
                <h3 className="mt-4 font-serif text-xl leading-snug text-white/92 transition-colors duration-300 group-hover:text-white">
                  {item.title}
                </h3>

                {/* Strapline */}
                <p className="mt-3 flex-1 text-sm leading-[1.7] text-white/42 transition-colors duration-300 group-hover:text-white/58">
                  {item.strapline}
                </p>

                {/* Divider */}
                <div className="my-5 h-px w-full bg-gradient-to-r from-white/[0.06] to-transparent" />

                {/* Output label */}
                <div className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/25">
                  Output
                </div>
                <div className="mt-1.5 text-[11px] leading-relaxed text-white/45">
                  {item.output}
                </div>

                {/* CTA row */}
                <div
                  className={cn(
                    "mt-5 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.22em] transition-all duration-300",
                    pal.cta,
                    isHovered && "gap-2.5",
                  )}
                >
                  {isFlagship ? "Open flagship" : "Open"}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>

              {/* Bottom shimmer */}
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
            </Link>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
        <span className="font-mono text-[8px] uppercase tracking-[0.28em] text-white/22">
          Each layer hands signal to the next without rework
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
      </div>
    </div>
  );
}