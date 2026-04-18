import type { PlaybookDefinition } from "@/lib/playbooks/types";

export const PLAYBOOK_REGISTRY: PlaybookDefinition[] = [
  {
    id: "crisis-alignment-protocol",
    title: "Crisis Alignment Protocol",
    summary:
      "Stabilize signal quality, decision ownership, and team alignment under active strain.",
    href: "/playbooks",
    failureModes: ["SIGNAL_FAILURE", "TRUST_EROSION", "SYSTEMIC_BREAKDOWN"],
    readiness: ["FRAGILE", "EMERGING", "STABILIZING"],
    routes: ["TEAM", "ENTERPRISE", "EXECUTIVE_REPORTING"],
    dominantDomains: ["trust", "leadership", "execution"],
    severity: "HIGH",
  },
  {
    id: "execution-breakdown-map",
    title: "Execution Breakdown Map",
    summary:
      "Locate where declared priority, ownership, and operating reality diverge.",
    href: "/playbooks",
    failureModes: ["EXECUTION_DRIFT", "STRUCTURAL_MISALIGNMENT"],
    readiness: ["EMERGING", "STABILIZING", "EXECUTION_READY"],
    routes: ["TEAM", "ENTERPRISE", "EXECUTIVE_REPORTING"],
    dominantDomains: ["execution", "behaviour", "priority"],
    severity: "MEDIUM",
  },
  {
    id: "authority-clarity-reset",
    title: "Authority Clarity Reset",
    summary:
      "Reconstruct decision rights, sponsor clarity, and escalation discipline before intervention.",
    href: "/playbooks",
    failureModes: ["AUTHORITY_BLINDSPOT", "GOVERNANCE_FAILURE"],
    readiness: ["FRAGILE", "EMERGING", "STABILIZING"],
    routes: ["CONSTITUTIONAL", "TEAM", "ENTERPRISE", "STRATEGY_ROOM"],
    dominantDomains: ["authority", "governance"],
    authorityTypes: ["PROXY", "UNCLEAR"],
    severity: "HIGH",
  },
  {
    id: "strategic-drift-correction",
    title: "Strategic Drift Correction",
    summary:
      "Correct drift between strategic language, resource allocation, and operating behavior.",
    href: "/playbooks",
    failureModes: ["STRUCTURAL_MISALIGNMENT", "EXECUTION_DRIFT"],
    readiness: ["EMERGING", "STABILIZING", "EXECUTION_READY"],
    routes: ["CONSTITUTIONAL", "TEAM", "ENTERPRISE", "EXECUTIVE_REPORTING"],
    dominantDomains: ["coherence", "identity", "execution"],
    severity: "MEDIUM",
  },
  {
    id: "board-decision-discipline",
    title: "Board Decision Discipline",
    summary:
      "Translate institutional strain into governed board-level decision sequence and consequence framing.",
    href: "/playbooks",
    failureModes: ["GOVERNANCE_FAILURE", "RISK_POSTURE_DEGRADATION", "SYSTEMIC_BREAKDOWN"],
    readiness: ["STABILIZING", "EXECUTION_READY", "SOVEREIGN"],
    routes: ["ENTERPRISE", "EXECUTIVE_REPORTING", "STRATEGY_ROOM"],
    dominantDomains: ["governance", "risk", "leadership"],
    authorityTypes: ["DIRECT", "PROXY"],
    severity: "HIGH",
  },
  {
    id: "trust-repair-sequence",
    title: "Trust Repair Sequence",
    summary:
      "Restore signal integrity where teams have stopped telling leadership the truth.",
    href: "/playbooks",
    failureModes: ["TRUST_EROSION", "SIGNAL_FAILURE", "CULTURAL_DEFLATION"],
    readiness: ["FRAGILE", "EMERGING", "STABILIZING"],
    routes: ["TEAM", "ENTERPRISE"],
    dominantDomains: ["trust", "relationship", "culture"],
    severity: "HIGH",
  },
];
