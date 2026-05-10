import * as React from "react";
import type { GovernedAutomationPosture } from "@/lib/product/governed-automation-contract";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`}
    />
  );
}

export default function GovernedAutomationPosturePanel({
  posture,
}: {
  posture: GovernedAutomationPosture | null;
}) {
  if (!posture) {
    return (
      <div style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "0.75rem 1rem" }}>
        <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(201,169,110,0.55)" }}>
          Governed Automation
        </p>
        <p className="mt-2 text-sm text-white/40">
          Automation posture is not yet available. Retained oversight must be configured before scheduler-backed automation activates.
        </p>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "0.75rem 1rem" }}>
      <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(201,169,110,0.55)" }}>
        Governed Automation
      </p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="flex items-center gap-2">
          <StatusDot active={posture.cadenceStatus === "SCHEDULER_ACTIVE"} />
          <span className="text-[11px] text-white/55">
            Cadence: {posture.cadenceStatus === "SCHEDULER_ACTIVE" ? "Scheduler-backed" : posture.cadenceStatus === "AWAITING_CONFIGURATION" ? "Awaiting configuration" : "No retained contract"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StatusDot active={posture.checkpointStatus === "TRACKING_ACTIVE"} />
          <span className="text-[11px] text-white/55">
            Checkpoints: {posture.checkpointStatus === "TRACKING_ACTIVE" ? "Tracking active" : "No active checkpoints"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StatusDot active={posture.deliveryStatus === "TRANSPORT_CONFIGURED"} />
          <span className="text-[11px] text-white/55">
            Delivery: {posture.deliveryStatus === "TRANSPORT_CONFIGURED" ? "Transport configured" : posture.deliveryStatus === "PREPARATION_AUTOMATED" ? "Preparation active" : "Awaiting transport"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StatusDot active={posture.suppressionStatus === "LOGGING_ACTIVE"} />
          <span className="text-[11px] text-white/55">
            Suppression: {posture.suppressionStatus === "LOGGING_ACTIVE" ? "Logging active" : "No suppressions"}
          </span>
        </div>
      </div>

      {posture.humanBoundaries.length > 0 && (
        <div className="mt-3">
          <p style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.25)" }}>Human review required for:</p>
          <p className="mt-1 text-[11px] text-white/40">{posture.humanBoundaries.join(" · ")}</p>
        </div>
      )}

      {posture.lastSweepAt && (
        <p style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.18)", marginTop: "0.5rem" }}>
          Last sweep: {new Date(posture.lastSweepAt).toLocaleString("en-GB")}
          {posture.nextScheduledAt ? ` · Next: ${new Date(posture.nextScheduledAt).toLocaleString("en-GB")}` : ""}
        </p>
      )}

      <p style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.15)", marginTop: "0.5rem" }}>
        {posture.publicLabel}
      </p>
    </div>
  );
}
