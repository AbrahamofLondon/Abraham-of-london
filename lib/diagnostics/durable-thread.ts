/**
 * lib/diagnostics/durable-thread.ts — Server-side durable thread retrieval
 *
 * Reconstructs a TensionThread from persisted diagnostic records.
 * Uses ConstitutionalIntakeReport as the primary source (email-indexed,
 * stores route/readiness/seriousness/decision/bridge JSON payloads).
 *
 * This is the sovereign authority layer — it cannot be cleared by the client.
 */

import { prisma } from "@/lib/prisma.server";
import type { TensionThread, TensionSignal, EscalationLevel } from "./tension-thread";

/**
 * Retrieve a durable tension thread from server-side diagnostic records.
 * Returns null if no prior diagnostics exist for this email.
 */
export async function retrieveDurableThread(
  email: string | null | undefined,
): Promise<TensionThread | null> {
  if (!email?.trim()) return null;

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Find most recent constitutional intake report for this email
    const intake = await prisma.constitutionalIntakeReport.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        route: true,
        confidence: true,
        readinessTier: true,
        posture: true,
        seriousnessScore: true,
        decisionJson: true,
        createdAt: true,
      },
    });

    if (!intake) return null;

    // Reconstruct tension signals from the persisted decision state
    const tensions = extractTensionsFromIntake(intake);
    if (tensions.length === 0) return null;

    const dominantPatterns = tensions
      .filter(t => t.severity === "medium" || t.severity === "high")
      .map(t => t.signal);

    const escalationLevel = computeEscalation(tensions);

    return {
      id: `durable_${intake.id}`,
      createdAt: intake.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stagesCompleted: ["constitutional"],
      tensions,
      dominantPatterns: [...new Set(dominantPatterns)],
      escalationLevel,
    };
  } catch (err) {
    console.warn("[DURABLE_THREAD] Failed to retrieve:", err instanceof Error ? err.message : err);
    return null;
  }
}

type IntakeRecord = {
  route: string | null;
  confidence: number | null;
  readinessTier: string | null;
  posture: string | null;
  seriousnessScore: number | null;
  decisionJson: any;
};

function extractTensionsFromIntake(intake: IntakeRecord): TensionSignal[] {
  const signals: TensionSignal[] = [];
  const src = "constitutional" as const;
  const route = intake.route ?? "";
  const readiness = intake.readinessTier ?? "";
  const posture = intake.posture ?? "";
  const seriousness = intake.seriousnessScore ?? 0;
  const confidence = intake.confidence ?? 0;

  // Parse decision JSON for disqualifiers and failure modes
  let decision: any = null;
  try {
    decision = typeof intake.decisionJson === "string"
      ? JSON.parse(intake.decisionJson)
      : intake.decisionJson;
  } catch {}

  // REJECT route = structural failure
  if (route === "REJECT") {
    signals.push({
      domain: "constitutional",
      signal: "structural_failure",
      severity: "high",
      source: src,
      evidence: `Constitutional route: REJECT. Confidence: ${(confidence * 100).toFixed(0)}%. Posture: ${posture}.`,
    });
  }

  // Low readiness
  if (readiness === "FRAGILE" || readiness === "EMERGING") {
    signals.push({
      domain: "readiness",
      signal: "unmanaged_risk",
      severity: readiness === "FRAGILE" ? "high" : "medium",
      source: src,
      evidence: `Readiness tier: ${readiness}. System cannot yet bear intervention cleanly.`,
    });
  }

  // Disordered/misaligned posture
  if (posture === "DISORDERED") {
    signals.push({
      domain: "governance",
      signal: "execution_drift",
      severity: "high",
      source: src,
      evidence: `Institutional posture: DISORDERED. Governance and execution both below threshold.`,
    });
  } else if (posture === "MISALIGNED") {
    signals.push({
      domain: "governance",
      signal: "execution_drift",
      severity: "medium",
      source: src,
      evidence: `Institutional posture: MISALIGNED. Governance intent contradicted by execution.`,
    });
  }

  // High seriousness with DIAGNOSTIC route = real strain but not ready
  if (seriousness > 65 && route === "DIAGNOSTIC") {
    signals.push({
      domain: "stakes",
      signal: "recursive_failure",
      severity: "medium",
      source: src,
      evidence: `High seriousness (${seriousness}%) but routed to DIAGNOSTIC — strain is real but readiness insufficient.`,
    });
  }

  // Extract disqualifiers from decision JSON if available
  if (decision?.disqualifiersTriggered?.length > 0) {
    const disqualifiers: string[] = decision.disqualifiersTriggered;
    if (disqualifiers.some(d => /authority/i.test(d))) {
      signals.push({
        domain: "authority",
        signal: "trust_asymmetry",
        severity: "medium",
        source: src,
        evidence: "Constitutional disqualifier: authority not sufficiently ordered.",
      });
    }
    if (disqualifiers.some(d => /clarity|coherence/i.test(d))) {
      signals.push({
        domain: "coherence",
        signal: "mandate_vacuum",
        severity: "medium",
        source: src,
        evidence: "Constitutional disqualifier: coherence/clarity below threshold.",
      });
    }
  }

  return signals;
}

function computeEscalation(tensions: TensionSignal[]): EscalationLevel {
  const highCount = tensions.filter(t => t.severity === "high").length;
  const mediumCount = tensions.filter(t => t.severity === "medium").length;
  const total = tensions.length;

  if (highCount > 0 || total >= 4) return "intervention_required";
  if (mediumCount >= 2 || total >= 3) return "structural_risk";
  if (total >= 1) return "pattern_detected";
  return "none";
}
