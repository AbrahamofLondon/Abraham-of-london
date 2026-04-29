"use client";

import * as React from "react";
import { AlertTriangle, ShieldAlert, Info } from "lucide-react";

import type { ChallengeResult } from "@/lib/server/decision/challenge-engine.server";

type Props = {
  challenge: ChallengeResult;
  onRevise: () => void;
  onAccept?: () => void;
};

const SEVERITY_CONFIG = {
  clarify: {
    Icon: Info,
    border: "border-amber-500/30",
    bg: "bg-amber-500/[0.04]",
    iconColor: "text-amber-400",
    label: "Clarification required",
  },
  challenge: {
    Icon: AlertTriangle,
    border: "border-orange-500/30",
    bg: "bg-orange-500/[0.04]",
    iconColor: "text-orange-400",
    label: "Decision-quality issue detected",
  },
  block: {
    Icon: ShieldAlert,
    border: "border-red-500/30",
    bg: "bg-red-500/[0.04]",
    iconColor: "text-red-400",
    label: "Cannot proceed",
  },
} as const;

export default function DecisionChallengeCard({ challenge, onRevise, onAccept }: Props) {
  if (challenge.severity === "none") return null;

  const config = SEVERITY_CONFIG[challenge.severity];
  const { Icon } = config;

  return (
    <div
      role="alert"
      className={`border ${config.border} ${config.bg} p-6 space-y-4`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <Icon className={`${config.iconColor} mt-0.5 h-5 w-5 shrink-0`} />
        <p className="text-sm font-medium text-white/70 uppercase tracking-wider">
          {config.label}
        </p>
      </div>

      {/* Challenge text */}
      {challenge.challengeText && (
        <p className="text-[15px] leading-relaxed text-white/90 pl-8">
          {challenge.challengeText}
        </p>
      )}

      {/* Clarification prompt */}
      {challenge.clarificationPrompt && (
        <p className="text-sm text-white/60 pl-8">
          {challenge.clarificationPrompt}
        </p>
      )}

      {/* Suggested options */}
      {challenge.suggestedOptions && challenge.suggestedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-8">
          {challenge.suggestedOptions.map((option) => (
            <span
              key={option}
              className="inline-block border border-white/[0.12] bg-white/[0.03] px-3 py-1 text-xs text-white/60"
            >
              {option}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pl-8 pt-2">
        <button
          type="button"
          onClick={onRevise}
          className="border border-white/[0.15] bg-white/[0.05] px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          Revise answer
        </button>

        {challenge.severity !== "block" && onAccept && (
          <button
            type="button"
            onClick={onAccept}
            className="px-4 py-2 text-sm text-white/40 transition-colors hover:text-white/60"
          >
            Accept and continue
          </button>
        )}
      </div>
    </div>
  );
}
