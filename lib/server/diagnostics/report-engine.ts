// server-only guard removed — Pages Router incompatible

/* lib/server/diagnostics/report-engine.ts */

import type { StoredDiagnosticRecord } from "@/lib/server/diagnostics/store";
import { verifySignedActionToken } from "@/lib/security/signed-action-token-core";

export type ReportPriority = "low" | "medium" | "high" | "critical";

export type GeneratedRecommendation = {
  id: string;
  title: string;
  detail: string;
  priority: ReportPriority;
};

export type GeneratedReport = {
  reportId: string;
  version: string;
  generatedAt: string;
  headline: string;
  strapline: string;
  executiveSummary: string;
  narrativeSummary: string;
  keyFindings: string[];
  recommendations: GeneratedRecommendation[];
  delivery: {
    htmlReady: true;
    pdfReady: true;
    unlocked: boolean;
  };
};

function safeString(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function pctBand(pct: number): "stable" | "watch" | "fragile" | "escalate" {
  if (pct >= 80) return "stable";
  if (pct >= 60) return "watch";
  if (pct >= 40) return "fragile";
  return "escalate";
}

function priorityFromPct(pct: number): ReportPriority {
  if (pct < 40) return "critical";
  if (pct < 60) return "high";
  if (pct < 80) return "medium";
  return "low";
}

function buildHeadline(record: StoredDiagnosticRecord): string {
  const pct = record.summary.pct;
  const title = safeString(record.title, record.kind);

  if (pct >= 80) {
    return `${title}: structurally stable, with selective watchpoints`;
  }
  if (pct >= 60) {
    return `${title}: functional, but beginning to show material strain`;
  }
  if (pct >= 40) {
    return `${title}: fragile, with correction now commercially justified`;
  }
  return `${title}: escalation warranted before the cost of drift compounds`;
}

function buildStrapline(record: StoredDiagnosticRecord): string {
  const kind = safeString(record.kind, "diagnostic");
  const band = pctBand(record.summary.pct);
  return `${kind.toUpperCase()} REPORT • ${band.toUpperCase()} CONDITION • REF ${record.diagnosticRef}`;
}

function buildExecutiveSummary(record: StoredDiagnosticRecord): string {
  const respondent =
    record.respondent.organisation ||
    record.respondent.name ||
    "the operating environment";

  const weakest = [...record.summary.sectionScores]
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 2)
    .map((s) => s.title);

  const weaknessText =
    weakest.length > 0
      ? `The weakest domains are ${weakest.join(" and ")}.`
      : "No weak domains were sufficiently pronounced to dominate the reading.";

  return [
    `${respondent} was assessed through the ${record.title} instrument.`,
    `The aggregate result is ${record.summary.totalScore}/${record.summary.maxScore} (${record.summary.pct}%), placing the subject in the ${record.summary.band} band with ${record.summary.severity} severity.`,
    weaknessText,
    `This report is intended to reduce ambiguity before intervention, escalation, or internal correction effort is commissioned.`,
  ].join(" ");
}

function buildNarrativeSummary(record: StoredDiagnosticRecord): string {
  const pct = record.summary.pct;

  if (pct >= 80) {
    return "The system presently appears coherent enough to sustain forward movement without emergency intervention. The task is not rescue, but vigilance: protect strength, monitor drift, and reinforce the domains that prevent future erosion.";
  }
  if (pct >= 60) {
    return "The system is still functional, but it is beginning to show enough strain that passivity would be foolish. The correct posture is disciplined correction before manageable weaknesses harden into structural cost.";
  }
  if (pct >= 40) {
    return "This environment is no longer merely inefficient. It is fragile. The reading suggests visible strain, uneven coherence, and enough weakness that corrective action is now commercially justified rather than optional.";
  }
  return "The system is operating in a condition where delay itself becomes a strategic error. The reading indicates elevated fragility, weak control in key domains, and a material case for escalation before the cost of drift compounds further.";
}

function buildKeyFindings(record: StoredDiagnosticRecord): string[] {
  const sorted = [...record.summary.sectionScores].sort((a, b) => a.pct - b.pct);
  const weakest = sorted.slice(0, 3);
  const strongest = [...record.summary.sectionScores]
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 1);

  const out: string[] = [];

  if (weakest[0]) {
    out.push(
      `${weakest[0].title} is the principal weakness at ${weakest[0].pct}%, making it the first correction priority.`,
    );
  }

  if (weakest[1]) {
    out.push(
      `${weakest[1].title} follows closely behind, which suggests this is not an isolated weakness but a pattern beginning to spread across the operating structure.`,
    );
  }

  if (strongest[0]) {
    out.push(
      `${strongest[0].title} is currently the strongest domain at ${strongest[0].pct}%, and should be used as a stabilising anchor rather than taken for granted.`,
    );
  }

  if (record.notes) {
    out.push(
      "Supplementary notes were provided and should be treated as contextual signal rather than ignored anecdote.",
    );
  }

  return out;
}

function buildRecommendations(
  record: StoredDiagnosticRecord,
): GeneratedRecommendation[] {
  const sorted = [...record.summary.sectionScores].sort((a, b) => a.pct - b.pct);

  const top = sorted.slice(0, 3).map((section, index) => {
    const priority = priorityFromPct(section.pct);

    let detail =
      "This domain should remain under review and receive measured reinforcement.";

    if (section.pct < 40) {
      detail =
        "This domain is materially weak and should be treated as a priority correction area before confidence erosion compounds into operational cost.";
    } else if (section.pct < 60) {
      detail =
        "This domain is unstable enough to justify targeted intervention, role clarification, and tighter execution discipline.";
    } else if (section.pct < 80) {
      detail =
        "This domain is not yet failing, but it shows enough strain to justify preventative correction rather than optimistic neglect.";
    }

    return {
      id: `rec-${index + 1}-${section.sectionId}`,
      title: `Correction Priority ${index + 1}: ${section.title}`,
      detail,
      priority,
    };
  });

  if (top.length === 0) {
    return [
      {
        id: "rec-1-maintain",
        title: "Maintain structural vigilance",
        detail:
          "No single domain triggered an immediate emergency response, but the system should remain under monitored review.",
        priority: "medium",
      },
    ];
  }

  return top;
}

export function composeDiagnosticReport(args: {
  record: StoredDiagnosticRecord;
  version?: string;
  unlocked?: boolean;
}): GeneratedReport {
  const { record } = args;
  const version = safeString(args.version, "2026.1");
  const unlocked = Boolean(args.unlocked);

  const reportId = `RPT-${record.diagnosticRef}-V${
    version.replace(/[^\d]+/g, "") || "1"
  }`;

  return {
    reportId,
    version,
    generatedAt: new Date().toISOString(),
    headline: buildHeadline(record),
    strapline: buildStrapline(record),
    executiveSummary: buildExecutiveSummary(record),
    narrativeSummary: buildNarrativeSummary(record),
    keyFindings: buildKeyFindings(record),
    recommendations: buildRecommendations(record),
    delivery: {
      htmlReady: true,
      pdfReady: true,
      unlocked,
    },
  };
}

export function nextReportVersion(previousVersion?: string | null): string {
  const current = safeString(previousVersion, "2026.1");
  const match = current.match(/^(\d{4})\.(\d+)$/);

  if (!match) return "2026.1";

  const year = match[1];
  const minor = Number(match[2] || "1");
  return `${year}.${minor + 1}`;
}

export function canUnlockReport(args: {
  record: StoredDiagnosticRecord;
  userTier: string;
  isAdmin: boolean;
  accessGranted?: boolean;
}): boolean {
  if (args.accessGranted) return true;
  if (args.isAdmin) return true;

  const tier = safeString(args.userTier).toLowerCase();

  return (
    tier === "inner-circle" ||
    tier === "vault" ||
    tier === "vault-plus" ||
    tier === "private" ||
    tier === "restricted" ||
    tier === "top-secret"
  );
}

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function matchesSignedReportSubject(record: StoredDiagnosticRecord, subject: string): boolean {
  const reportId = normalize(record.report?.reportId);
  const normalizedSubject = normalize(subject);

  if (!normalizedSubject) return false;

  return [
    record.diagnosticRef,
    `ref:${record.diagnosticRef}`,
    reportId,
    reportId ? `report:${reportId}` : "",
  ]
    .filter(Boolean)
    .includes(normalizedSubject);
}

export function assertDiagnosticReportAccess(args: {
  record: StoredDiagnosticRecord;
  userId?: string | null;
  token?: string | null;
  purpose: string;
}):
  | { allowed: true; via: "owner" | "signed_token" }
  | { allowed: false; status: 401 | 403; error: string } {
  const ownerUserId = normalize(args.record.actor.userId);
  const requesterUserId = normalize(args.userId);
  const token = normalize(args.token);

  if (ownerUserId) {
    if (!requesterUserId) {
      return { allowed: false, status: 401, error: "AUTH_REQUIRED" };
    }

    if (requesterUserId !== ownerUserId) {
      return { allowed: false, status: 403, error: "FORBIDDEN" };
    }

    return { allowed: true, via: "owner" };
  }

  // Ownerless reports are deny-by-default and require an explicit signed token.
  if (!token) {
    return { allowed: false, status: 403, error: "FORBIDDEN" };
  }

  const verified = verifySignedActionToken(token, args.purpose);
  if (!verified.ok || !matchesSignedReportSubject(args.record, verified.payload.subject)) {
    return { allowed: false, status: 403, error: "FORBIDDEN" };
  }

  return { allowed: true, via: "signed_token" };
}
