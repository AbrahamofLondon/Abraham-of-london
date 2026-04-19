"use client";

import * as React from "react";
import { track } from "@/lib/analytics/track";

type PublicProofItem = {
  id: string;
  proofType: string;
  outcomeCategory?: string | null;
  anonymisedSummary?: string | null;
  displayLabel?: string | null;
  sourceStage: string;
};

type PublicProofResponse = {
  ok: true;
  items: PublicProofItem[];
  metrics: {
    sampleSize: number;
    precisePct: number | null;
    clarifiedPct: number | null;
    nextStepChangedPct: number | null;
  };
};

const fallbackOutcomes = [
  "Leadership misalignment identified → decision cadence stabilised within 30 days",
  "Governance drift detected → execution clarity restored across teams",
  "High-risk decisions surfaced early → escalation prevented structural damage",
];

export function ObservedOutcomesBlock({
  fallback = true,
}: {
  fallback?: boolean;
}) {
  const [data, setData] = React.useState<PublicProofResponse | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/proof/public")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.ok) setData(json);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const approved = (data?.items || []).filter((item) => item.anonymisedSummary).slice(0, 4);
  const cards = approved.length
    ? approved.map((item) => item.anonymisedSummary as string)
    : fallback
      ? fallbackOutcomes
      : [];

  React.useEffect(() => {
    if (cards.length) {
      track("proof_displayed", {
        proof_type: approved.length ? "approved_public" : "fallback_pattern",
        count: cards.length,
      });
    }
  }, [approved.length, cards.length]);

  if (!cards.length) return null;

  return (
    <div className="mt-6 grid gap-4">
      {cards.map((outcome) => (
        <div
          key={outcome}
          className="border p-5"
          style={{
            borderColor: "rgba(255,255,255,0.10)",
            backgroundColor: "rgba(255,255,255,0.035)",
          }}
        >
          <p className="text-[14px] leading-[1.65]" style={{ color: "#F5F5F5" }}>
            {outcome}
          </p>
        </div>
      ))}
    </div>
  );
}

export function AccuracyMetricsBlock() {
  const [data, setData] = React.useState<PublicProofResponse | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/proof/public")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.ok) setData(json);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data || data.metrics.sampleSize < 5) return null;

  const metrics = [
    data.metrics.precisePct != null
      ? `${data.metrics.precisePct}% said the result reflected their situation precisely`
      : null,
    data.metrics.clarifiedPct != null
      ? `${data.metrics.clarifiedPct}% said it clarified what was actually wrong`
      : null,
    data.metrics.nextStepChangedPct != null
      ? `${data.metrics.nextStepChangedPct}% said it changed what they believed needed to happen next`
      : null,
  ].filter(Boolean) as string[];

  if (!metrics.length) return null;

  return (
    <div className="mt-6 grid gap-3 md:grid-cols-3">
      {metrics.map((metric) => (
        <div
          key={metric}
          className="border p-4"
          style={{
            borderColor: "rgba(201,169,110,0.22)",
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        >
          <p className="text-[13px] leading-[1.55]" style={{ color: "#B8B8B8" }}>
            {metric}
          </p>
        </div>
      ))}
    </div>
  );
}
