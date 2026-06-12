"use client";

import * as React from "react";
import type { ReportTier } from "@/lib/reporting/report-experience-standard";

export type ArrivalScreenProps = {
  tier: ReportTier;
  customerName?: string;
  organisationName?: string;
  referenceId: string;
  productName: string;
  issueDate: string;
  artifactHash?: string;
  weightStatement?: string;
  onComplete: () => void;
  autoAdvanceDuration?: number;
  allowSkip?: boolean;
  children?: React.ReactNode;
};

const DEFAULT_DURATION_BY_TIER: Record<ReportTier, number> = {
  free: 1800,
  paid: 2800,
  boardroom: 4600,
  executive: 5400,
  retainer: 5400,
  "public-proof": 2800,
};

const CLASSIFICATION_BY_TIER: Record<ReportTier, string> = {
  free: "SIGNAL",
  paid: "PAID BRIEF",
  boardroom: "BOARDROOM BRIEF · CONFIDENTIAL",
  executive: "EXECUTIVE REPORT · CONTROLLED",
  retainer: "RETAINED OVERSIGHT · CONTROLLED",
  "public-proof": "PUBLIC PROOF · VERIFIED",
};

function defaultWeightStatement(tier: ReportTier, productName: string): string {
  if (tier === "free") return "Your signal is ready.";
  if (tier === "boardroom") {
    return "This brief was prepared on the basis of your submitted intake and Abraham of London's structured analysis of the decision and its material risks.";
  }
  if (tier === "executive" || tier === "retainer") {
    return "This document has been prepared for controlled circulation, considered reading, and governed follow-through.";
  }
  return `What follows is a structured assessment of ${productName}.`;
}

function personalLine(customerName?: string, organisationName?: string): string | null {
  if (organisationName) return `Prepared for ${organisationName}`;
  if (customerName) return `Prepared for ${customerName}`;
  return null;
}

export function ArrivalScreen({
  tier,
  customerName,
  organisationName,
  referenceId,
  productName,
  issueDate,
  artifactHash,
  weightStatement,
  onComplete,
  autoAdvanceDuration,
  allowSkip,
  children,
}: ArrivalScreenProps) {
  const [complete, setComplete] = React.useState(false);
  const duration = autoAdvanceDuration ?? DEFAULT_DURATION_BY_TIER[tier];
  const canSkip = allowSkip ?? (tier === "free" || tier === "paid" || tier === "public-proof");
  const addressee = personalLine(customerName, organisationName);

  const finish = React.useCallback(() => {
    setComplete((wasComplete) => {
      if (!wasComplete) onComplete();
      return true;
    });
  }, [onComplete]);

  React.useEffect(() => {
    if (complete) return undefined;
    const timer = window.setTimeout(finish, duration);
    return () => window.clearTimeout(timer);
  }, [complete, duration, finish]);

  if (complete) return <>{children}</>;

  const dark = tier === "boardroom" || tier === "executive" || tier === "retainer";
  const intelligence = productName.toLowerCase().includes("intelligence");

  return (
    <section
      aria-label={`${productName} arrival`}
      className={[
        "min-h-screen w-full overflow-hidden",
        "flex items-center justify-center px-6 py-12",
        dark ? "bg-[#0f0e0b] text-[#f5f0e8]" : "bg-[#f5f0e8] text-[#1a1814]",
      ].join(" ")}
    >
      <div
        className={[
          "absolute inset-0 pointer-events-none",
          dark ? "opacity-40" : "opacity-25",
          intelligence
            ? "bg-[radial-gradient(circle_at_50%_40%,rgba(184,148,63,0.18),transparent_32%)]"
            : "bg-[linear-gradient(135deg,rgba(184,148,63,0.12),transparent_38%,rgba(255,255,255,0.04))]",
        ].join(" ")}
      />

      <div className="relative mx-auto flex min-h-[460px] w-full max-w-4xl flex-col justify-between">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-serif text-2xl italic tracking-normal text-[#b8943f]">
              Abraham of London
            </p>
            <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.28em] opacity-45">
              Alomarada Ltd
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#b8943f]">
              {CLASSIFICATION_BY_TIER[tier]}
            </p>
            <p className="mt-2 text-[10px] font-mono opacity-45">{issueDate}</p>
          </div>
        </div>

        <div className="max-w-3xl">
          <p className="mb-5 text-[11px] font-mono uppercase tracking-[0.28em] text-[#b8943f]">
            {referenceId}
          </p>
          <h1 className="max-w-3xl font-serif text-4xl leading-tight tracking-normal md:text-6xl">
            {productName}
          </h1>
          <div className="mt-7 h-px w-28 bg-[#b8943f]" />
          {addressee ? (
            <p className="mt-7 text-sm uppercase tracking-[0.18em] opacity-60">{addressee}</p>
          ) : null}
          <p className="mt-5 max-w-2xl text-base leading-7 opacity-75">
            {weightStatement ?? defaultWeightStatement(tier, productName)}
          </p>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#b8943f]/25 pt-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1 text-[10px] font-mono uppercase tracking-[0.16em] opacity-45">
            <p>Reference {referenceId}</p>
            {artifactHash ? <p>Artifact hash {artifactHash}</p> : null}
          </div>

          {canSkip ? (
            <button
              type="button"
              onClick={finish}
              className="self-start border border-[#b8943f]/40 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#b8943f] transition hover:border-[#b8943f] hover:bg-[#b8943f]/10 md:self-auto"
            >
              Read
            </button>
          ) : (
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#b8943f]/70">
              Preparing transmission
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export function ArrivalGate(props: ArrivalScreenProps) {
  return <ArrivalScreen {...props} />;
}

export default ArrivalScreen;
