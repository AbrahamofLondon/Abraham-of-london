"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  FileText,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  readConstitutionalHandoff,
  type ConstitutionalHandoffStage,
} from "@/lib/diagnostics/constitutional-handoff";
import type { ConstitutionalBridgeBundle } from "@/lib/diagnostics/constitutional-bridge";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function stageMeta(stage: ConstitutionalHandoffStage) {
  switch (stage) {
    case "team-assessment":
      return {
        icon: Users,
        title: "Inherited constitutional context available",
        body: "This stage has received authority, coherence, pressure, friction, posture, and readiness context from the initial constitutional intake.",
        href: "/diagnostics",
        cta: "Back to intake",
      };
    case "strategy-room":
      return {
        icon: Crown,
        title: "Escalation context has been carried forward",
        body: "This room can use the initial constitutional reading instead of forcing a blind restart.",
        href: "/strategy-room",
        cta: "Remain in Strategy Room",
      };
    case "executive-reporting":
    default:
      return {
        icon: FileText,
        title: "Executive Reporting has inherited the first reading",
        body: "This page can now use the constitutional intake as pre-read context instead of treating the user like they never spoke.",
        href: "/diagnostics/executive-reporting",
        cta: "Continue",
      };
  }
}

export default function InheritedSignalBanner({
  stage,
}: {
  stage: ConstitutionalHandoffStage;
}) {
  const [ready, setReady] = React.useState(false);
  const [bridge, setBridge] = React.useState<ConstitutionalBridgeBundle | null>(null);

  React.useEffect(() => {
    const payload = readConstitutionalHandoff(stage);
    if (!payload?.token) {
      setReady(true);
      return;
    }

    void fetch(
      `/api/diagnostics/constitutional-handoff/${stage}?token=${encodeURIComponent(payload.token)}`,
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((json) => {
        if (json?.ok && json.bridge) {
          setBridge(json.bridge as ConstitutionalBridgeBundle);
        }
      })
      .finally(() => setReady(true));
  }, [stage]);

  if (!ready || !bridge) return null;

  const meta = stageMeta(stage);
  const Icon = meta.icon;
  const executive = bridge.executiveReporting;
  const team = bridge.teamAssessment;
  const route = bridge.strategyRoom.escalationFit.route;

  return (
    <div className="mb-8 rounded-[28px] border border-emerald-400/18 bg-emerald-500/8 p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-200">
              Inherited Context
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Icon className="h-5 w-5 text-emerald-300" />
            <h3 className="text-xl font-semibold text-white">{meta.title}</h3>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
            {meta.body}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-white/65">
              Route {route}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-white/65">
              Posture {executive.posture}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-white/65">
              Readiness {executive.readinessTier}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-white/65">
              Authority {executive.authorityType}
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40">
                Executive headline
              </div>
              <div className="mt-2 text-sm leading-6 text-white/78">
                {executive.headline}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40">
                Team hypothesis
              </div>
              <div className="mt-2 text-sm leading-6 text-white/78">
                {team.hypotheses[0] || "Inherited context available for team-level verification."}
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <Link
            href={meta.href}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            {meta.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
