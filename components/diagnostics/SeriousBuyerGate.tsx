"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Activity,
  Crown,
  FileText,
  ShieldCheck,
} from "lucide-react";

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

type GatePath = {
  href: string;
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
  primary?: boolean;
};

const PATHS: GatePath[] = [
  {
    href: "/diagnostics",
    title: "Begin with Diagnostics",
    body: "Start here when the issue still needs disciplined reading, route clarity, and a better understanding of the signal.",
    icon: Activity,
    primary: true,
  },
  {
    href: "/diagnostics/executive-reporting",
    title: "Review Executive Reporting",
    body: "Go here when the signal is serious enough to justify a flagship interpretation layer before advisory escalation.",
    icon: FileText,
  },
  {
    href: "/consulting/strategy-room",
    title: "Enter Strategy Room",
    body: "Use the chamber when the cost of delay, misjudgment, or mis-execution is already material and mandate fit is clear.",
    icon: Crown,
  },
];

export default function SeriousBuyerGate() {
  return (
    <section className="border border-amber-500/30 bg-amber-500/[0.03] p-8 md:p-10">
      <div className="mx-auto max-w-5xl text-center">
        <div className="inline-flex items-center gap-3">
          <ShieldCheck className="h-4 w-4 text-amber-400/70" />
          <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-amber-300/78">
            Serious buyer gate
          </span>
        </div>

        <h2 className="mt-6 font-serif text-4xl text-white md:text-5xl">
          This system is not built for casual exploration
        </h2>

        <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-white/56 md:text-lg">
          If the matter has no real consequence, this architecture is excessive.
          If it does, delay increases cost, weakens judgment, and makes
          correction more expensive than it needed to be.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PATHS.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className={cn(
                  "border p-5 text-left",
                  item.primary
                    ? "border-amber-500/24 bg-amber-500/[0.05]"
                    : "border-white/[0.08] bg-black/20",
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      item.primary ? "text-amber-400/80" : "text-white/55",
                    )}
                  />
                  <div
                    className={cn(
                      "font-mono text-[8px] uppercase tracking-[0.22em]",
                      item.primary ? "text-amber-300/78" : "text-white/30",
                    )}
                  >
                    Route
                  </div>
                </div>

                <h3 className="mt-4 font-serif text-2xl text-white">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-white/50">
                  {item.body}
                </p>

                <div className="mt-6">
                  <Link
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] transition-colors",
                      item.primary
                        ? "text-amber-300 hover:text-amber-200"
                        : "text-white/70 hover:text-white",
                    )}
                  >
                    <span>Open</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-white/8 bg-black/20 p-5">
          <p className="mx-auto max-w-3xl text-sm leading-relaxed text-white/52">
            The architecture is simple: diagnose first, interpret properly,
            escalate only where the situation justifies mandate-level action.
          </p>
        </div>
      </div>
    </section>
  );
}