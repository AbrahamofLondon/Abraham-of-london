// components/strategy-room/DecisionGuidancePanel.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Crown,
  ExternalLink,
  FileText,
  GitBranch,
  ShieldCheck,
  Sparkles,
  Target,
  BookOpen,
} from "lucide-react";

import { ASSET_KINDS } from "@/lib/decision/decision-taxonomy";
import type { AssetKind } from "@/lib/decision/decision-metadata";

type Recommendation = {
  id: string;
  title: string;
  href?: string;
  kind: AssetKind | string;
  summary?: string;
  score: number;
  reasons: string[];
};

type KindTone = {
  label: string;
  chip: string;
  icon: React.ElementType;
};

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(value), min), max);
}

function normaliseKind(kind: string): string {
  return kind.trim().toLowerCase();
}

function isKnownAssetKind(kind: string): kind is AssetKind {
  return ASSET_KINDS.includes(kind as AssetKind);
}

function getKindTone(kind: Recommendation["kind"]): KindTone {
  const value = normaliseKind(String(kind));

  if (!isKnownAssetKind(value)) {
    return {
      label: String(kind || "Guidance"),
      chip: "border-white/10 bg-white/5 text-white/65",
      icon: ShieldCheck,
    };
  }

  switch (value) {
    case "brief":
      return {
        label: "Brief",
        chip: "border-sky-400/25 bg-sky-500/10 text-sky-300",
        icon: FileText,
      };
    case "playbook":
      return {
        label: "Playbook",
        chip: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
        icon: Crown,
      };
    case "doctrine":
      return {
        label: "Doctrine",
        chip: "border-violet-400/25 bg-violet-500/10 text-violet-300",
        icon: BookOpen,
      };
    case "framework":
      return {
        label: "Framework",
        chip: "border-amber-400/25 bg-amber-500/10 text-amber-300",
        icon: Compass,
      };
    case "report-module":
      return {
        label: "Report Module",
        chip: "border-[#C9A96A]/25 bg-[#C9A96A]/10 text-[#E6C27A]",
        icon: GitBranch,
      };
    default:
      return {
        label: value,
        chip: "border-white/10 bg-white/5 text-white/65",
        icon: ShieldCheck,
      };
  }
}

function scoreTone(score: number): string {
  if (score >= 85) return "text-emerald-300";
  if (score >= 70) return "text-[#E6C27A]";
  if (score >= 55) return "text-amber-300";
  return "text-white/60";
}

function scoreBar(score: number): string {
  if (score >= 85) return "bg-emerald-400";
  if (score >= 70) return "bg-[#C9A96A]";
  if (score >= 55) return "bg-amber-300";
  return "bg-white/30";
}

function OpenAction({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const isInternal = href.startsWith("/");

  if (isInternal) {
    return (
      <Link
        href={href}
        className={cn(
          "group inline-flex items-center gap-2 rounded-full border px-4 py-2",
          "text-[10px] font-mono uppercase tracking-[0.18em] transition-colors",
          "border-[#C9A96A]/30 bg-[#C9A96A]/[0.04] text-[#E7D2A4]",
          "hover:border-[#C9A96A]/50 hover:bg-[#C9A96A]/10",
        )}
      >
        {children}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border px-4 py-2",
        "text-[10px] font-mono uppercase tracking-[0.18em] transition-colors",
        "border-[#C9A96A]/30 bg-[#C9A96A]/[0.04] text-[#E7D2A4]",
        "hover:border-[#C9A96A]/50 hover:bg-[#C9A96A]/10",
      )}
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" />
    </a>
  );
}

function RecommendationCard({ item }: { item: Recommendation }) {
  const tone = getKindTone(item.kind);
  const KindIcon = tone.icon;
  const score = clamp(item.score, 0, 100);
  const visibleReasons = Array.from(new Set(item.reasons)).slice(0, 4);

  return (
    <div className="rounded-[24px] border border-white/[0.08] bg-black/30 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
                "text-[10px] font-medium uppercase tracking-[0.14em]",
                tone.chip,
              )}
            >
              <KindIcon className="h-3.5 w-3.5" />
              {tone.label}
            </span>

            <span className={cn("text-[11px] font-medium", scoreTone(score))}>
              Match {score}
            </span>
          </div>

          <h4 className="mt-3 text-lg leading-snug text-white">{item.title}</h4>

          {item.summary ? (
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/62">
              {item.summary}
            </p>
          ) : null}
        </div>

        {item.href ? <OpenAction href={item.href}>Open</OpenAction> : null}
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn("h-full rounded-full transition-all duration-500", scoreBar(score))}
          style={{ width: `${score}%` }}
        />
      </div>

      {visibleReasons.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {visibleReasons.map((reason) => (
            <span
              key={reason}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/58"
            >
              {reason}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DecisionGuidancePanel({
  summary,
  nextAction,
  recommendations,
}: {
  summary: string;
  nextAction: string;
  recommendations: Recommendation[];
}) {
  if (!recommendations.length) return null;

  const visible = recommendations
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return (
    <section className="mt-8 overflow-hidden rounded-[30px] border border-white/[0.08] bg-white/[0.02] shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur-sm">
      <div className="border-b border-white/[0.07] px-6 py-5 sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#C9A96A]/20 bg-[#C9A96A]/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.24em] text-[#E6C27A]">
            <Sparkles className="h-3.5 w-3.5" />
            Decision Guidance
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-white/45">
            Prioritised direction
          </span>
        </div>

        <h3 className="mt-4 text-2xl font-serif tracking-tight text-white">
          Recommended direction
        </h3>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/66">{summary}</p>
      </div>

      <div className="px-6 py-6 sm:px-8">
        <div className="rounded-[24px] border border-[#C9A96A]/20 bg-[#C9A96A]/[0.07] p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-[#C9A96A]/20 bg-[#C9A96A]/10 p-2.5">
              <Target className="h-4 w-4 text-[#E6C27A]" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#E6C27A]/80">
                Immediate next move
              </div>
              <div className="mt-2 text-sm leading-7 text-[#EBD9B3]">{nextAction}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {visible.map((item) => (
            <RecommendationCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}