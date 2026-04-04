"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Lock,
  ShieldCheck,
  Sparkles,
  FileStack,
} from "lucide-react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function PlaybookCard({
  title,
  description,
  href,
  locked = true,
}: {
  title: string;
  description: string;
  href: string;
  locked?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative block overflow-hidden rounded-[28px]",
        "border border-white/[0.08] bg-[linear-gradient(180deg,rgba(16,16,17,0.96)_0%,rgba(8,8,9,0.98)_100%)]",
        "p-8 shadow-[0_24px_70px_rgba(0,0,0,0.34)] transition-all duration-300",
        "hover:-translate-y-1 hover:border-[#C9A96A]/30 hover:shadow-[0_28px_90px_rgba(0,0,0,0.42)]",
        "focus:outline-none focus:ring-2 focus:ring-[#C9A96A]/30",
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,169,106,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_28%)] opacity-90" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A96A]/40 to-transparent" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-[#C9A96A]/20 bg-[#C9A96A]/10 p-2.5">
              <FileStack className="h-4 w-4 text-[#E6C27A]" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#E6C27A]/80">
                  Institutional Playbook
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/45">
                  Strategic asset
                </span>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em]",
              locked
                ? "border-amber-400/20 bg-amber-500/10 text-amber-200/80"
                : "border-emerald-400/20 bg-emerald-500/10 text-emerald-200/80",
            )}
          >
            {locked ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                Restricted
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5" />
                Available
              </>
            )}
          </div>
        </div>

        <div className="mt-7">
          <h3 className="max-w-[16ch] font-serif text-3xl leading-[1.02] tracking-tight text-white transition-colors duration-300 group-hover:text-white">
            {title}
          </h3>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58">
            {description}
          </p>
        </div>

        <div className="mt-7 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/52">
            Guided structure
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/52">
            Execution discipline
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/52">
            Decision clarity
          </span>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4 border-t border-white/[0.07] pt-6">
          <div className="inline-flex items-center gap-2 text-[11px] text-white/42">
            <Sparkles className="h-3.5 w-3.5 text-[#C9A96A]/75" />
            <span>Built for serious operators</span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A96A]/25 bg-[#C9A96A]/[0.05] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#E6C27A] transition-all duration-300 group-hover:border-[#C9A96A]/45 group-hover:bg-[#C9A96A]/[0.10]">
            {locked ? "Request access" : "Open playbook"}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}