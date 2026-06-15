/**
 * lib/living-intelligence/living-report-composer.ts
 *
 * Creates the living estate intelligence report in JSON and Markdown formats.
 *
 * The report includes:
 *   - Executive summary with counts
 *   - Contradictions by severity
 *   - Interventions by classification
 *   - Recommendations by priority
 *   - Guardrail violations
 *   - Owner decisions required
 *   - Safe actions summary
 *   - Blocked actions summary
 *   - Source-of-truth conflicts
 *   - Full estate snapshot
 */

import type {
  LivingReport,
  Contradiction,
  Intervention,
  Recommendation,
  GuardrailViolation,
  EstateSnapshot,
} from "./estate-state-contract";

// ─── Report Builder ──────────────────────────────────────────────────────────

export function buildLivingReport(
  snapshot: EstateSnapshot,
  contradictions: Contradiction[],
  interventions: Intervention[],
  recommendations: Recommendation[],
  guardrailViolations: GuardrailViolation[],
): LivingReport {
  const failures = contradictions.filter((c) => c.isFailure).length;
  const warnings = contradictions.filter(
    (c) => !c.isFailure && c.severity !== "informational_note" && c.severity !== "governed_tension",
  ).length;
  const informationalTensions = contradictions.filter(
    (c) => c.severity === "informational_note" || c.severity === "governed_tension",
  ).length;
  const ownerDecisionsRequired = contradictions.filter((c) => c.requiresOwnerDecision).length;
  const checkoutBypasses = contradictions.filter((c) => c.severity === "checkout_bypass").length;

  // Determine exit code: non-zero if any failure exists that is not a governed tension
  const hasUnsafeContradictions = contradictions.some(
    (c) => c.isFailure && c.severity !== "governed_tension" && c.severity !== "informational_note",
  );
  const exitCode = hasUnsafeContradictions ? 1 : 0;

  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalContradictions: contradictions.length,
      failures,
      warnings,
      informationalTensions,
      ownerDecisionsRequired,
      guardrailViolations: guardrailViolations.length,
      checkoutBypasses,
    },
    contradictions,
    interventions,
    recommendations,
    guardrailViolations,
    snapshot,
    exitCode,
  };
}

// ─── Markdown Composer ───────────────────────────────────────────────────────

function severityBadge(severity: string): string {
  const badges: Record<string, string> = {
    fatal_build_blocker: "🔴 FATAL",
    commercial_safety_blocker: "🔴 SAFETY",
    checkout_bypass: "🔴 BYPASS",
    governance_contradiction: "🟠 GOVERNANCE",
    publication_lifecycle_conflict: "🟠 LIFECYCLE",
    content_route_failure: "🟡 ROUTE",
    storefront_gap: "🟡 STOREFRONT",
    narrative_drift: "🟡 NARRATIVE",
    test_drift: "🟡 TEST",
    source_of_truth_conflict: "🟠 SOT",
    owner_decision_required: "🔵 DECISION",
    governed_tension: "⚪ TENSION",
    informational_note: "⚪ INFO",
  };
  return badges[severity] ?? severity;
}

function priorityBadge(priority: string): string {
  const badges: Record<string, string> = {
    critical: "🔴 CRITICAL",
    high: "🟠 HIGH",
    medium: "🟡 MEDIUM",
    low: "⚪ LOW",
  };
  return badges[priority] ?? priority;
}

export function composeMarkdownReport(report: LivingReport): string {
  const lines: string[] = [];

  lines.push("# Living Estate Intelligence Report");
  lines.push("");
  lines.push(`**Generated:** ${report.timestamp}`);
  lines.push(`**Exit Code:** ${report.exitCode}`);
  lines.push("");
  lines.push("## Executive Summary");
  lines.push("");
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Contradictions | ${report.summary.totalContradictions} |`);
  lines.push(`| Failures (must fix) | ${report.summary.failures} |`);
  lines.push(`| Warnings | ${report.summary.warnings} |`);
  lines.push(`| Informational / Tensions | ${report.summary.informationalTensions} |`);
  lines.push(`| Owner Decisions Required | ${report.summary.ownerDecisionsRequired} |`);
  lines.push(`| Guardrail Violations | ${report.summary.guardrailViolations} |`);
  lines.push(`| Checkout Bypasses | ${report.summary.checkoutBypasses} |`);
  lines.push("");

  // ── Contradictions by Severity ──────────────────────────────────────────
  lines.push("## Contradictions by Severity");
  lines.push("");

  const bySeverity: Record<string, Contradiction[]> = {};
  for (const c of report.contradictions) {
    const sev = c.severity;
    if (!bySeverity[sev]) bySeverity[sev] = [];
    bySeverity[sev].push(c);
  }

  for (const [severity, items] of Object.entries(bySeverity)) {
    lines.push(`### ${severityBadge(severity)} — ${items.length} issue(s)`);
    lines.push("");
    for (const item of items) {
      lines.push(`**${item.title}**`);
      lines.push("");
      lines.push(`${item.description}`);
      lines.push("");
      lines.push(`- **Domains:** ${item.domains.join(", ")}`);
      lines.push(`- **Authority:** ${item.authoritativeSource}`);
      lines.push(`- **Failure:** ${item.isFailure ? "Yes" : "No"}`);
      lines.push(`- **Owner Decision:** ${item.requiresOwnerDecision ? "Required" : "Not required"}`);
      lines.push(`- **Recommendation:** ${item.recommendation}`);
      lines.push("");
    }
  }

  // ── Interventions ───────────────────────────────────────────────────────
  lines.push("## Interventions");
  lines.push("");
  lines.push("| ID | Classification | Auto-fixable | Human Review | Owner Decision |");
  lines.push("|----|---------------|-------------|-------------|----------------|");
  for (const inv of report.interventions) {
    lines.push(
      `| ${inv.contradictionId} | ${inv.classification} | ${inv.autoFixable ? "Yes" : "No"} | ` +
        `${inv.requiresHumanReview ? "Yes" : "No"} | ${inv.requiresOwnerDecision ? "Yes" : "No"} |`,
    );
  }
  lines.push("");

  // ── Recommendations by Priority ─────────────────────────────────────────
  lines.push("## Recommendations by Priority");
  lines.push("");
  const byPriority: Record<string, Recommendation[]> = { critical: [], high: [], medium: [], low: [] };
  for (const rec of report.recommendations) {
    const pri = rec.priority;
    if (byPriority[pri]) byPriority[pri].push(rec);
  }

  for (const [priority, items] of Object.entries(byPriority)) {
    if (items.length === 0) continue;
    lines.push(`### ${priorityBadge(priority)} — ${items.length} recommendation(s)`);
    lines.push("");
    for (const item of items) {
      lines.push(`- **Action:** ${item.action} on **${item.target}**`);
      lines.push(`  - **Reason:** ${item.reason}`);
      lines.push(`  - **Auto-safe:** ${item.autoSafe ? "Yes" : "No"}`);
      lines.push("");
    }
  }

  // ── Guardrail Violations ────────────────────────────────────────────────
  if (report.guardrailViolations.length > 0) {
    lines.push("## Guardrail Violations");
    lines.push("");
    for (const v of report.guardrailViolations) {
      const icon = v.severity === "violation" ? "🔴" : v.severity === "warning" ? "🟡" : "⚪";
      lines.push(`### ${icon} ${v.guardrail}`);
      lines.push("");
      lines.push(`${v.description}`);
      lines.push("");
      lines.push(`**Details:** ${v.details}`);
      lines.push("");
    }
  }

  // ── Owner Decisions Required ────────────────────────────────────────────
  const ownerDecisions = report.contradictions.filter((c) => c.requiresOwnerDecision);
  if (ownerDecisions.length > 0) {
    lines.push("## Owner Decisions Required");
    lines.push("");
    for (const c of ownerDecisions) {
      lines.push(`### ${c.title}`);
      lines.push("");
      lines.push(`${c.description}`);
      lines.push("");
      lines.push(`**Recommendation:** ${c.recommendation}`);
      lines.push("");
    }
  }

  // ── Safe Actions ────────────────────────────────────────────────────────
  const safeActions = report.recommendations.filter((r) => r.autoSafe);
  if (safeActions.length > 0) {
    lines.push("## Safe Actions (auto-safe, no deployment risk)");
    lines.push("");
    for (const r of safeActions) {
      lines.push(`- **${r.action}** on ${r.target}: ${r.reason}`);
    }
    lines.push("");
  }

  // ── Blocked Actions ─────────────────────────────────────────────────────
  const blockedActions = report.recommendations.filter((r) => !r.autoSafe && r.priority !== "low");
  if (blockedActions.length > 0) {
    lines.push("## Blocked Actions (must resolve before deployment)");
    lines.push("");
    for (const r of blockedActions) {
      lines.push(`- **${r.action}** on ${r.target} (${r.priority}): ${r.reason}`);
    }
    lines.push("");
  }

  // ── Source-of-Truth Conflicts ───────────────────────────────────────────
  const sotConflicts = report.contradictions.filter((c) => c.severity === "source_of_truth_conflict");
  if (sotConflicts.length > 0) {
    lines.push("## Source-of-Truth Conflicts");
    lines.push("");
    for (const c of sotConflicts) {
      lines.push(`### ${c.title}`);
      lines.push("");
      lines.push(`${c.description}`);
      lines.push("");
      lines.push(`**Authoritative source:** ${c.authoritativeSource}`);
      lines.push("");
    }
  }

  // ── Estate Snapshot Summary ─────────────────────────────────────────────
  lines.push("## Estate Snapshot Summary");
  lines.push("");
  lines.push(`- **Products tracked:** ${Object.keys(report.snapshot.products).length}`);
  lines.push(`- **GMI editions:** ${report.snapshot.gmiEditions.length}`);
  lines.push(`- **Content families:** ${report.snapshot.contentFamilies.length}`);
  lines.push(`- **Governance-only codes:** ${report.snapshot.governanceOnlyCodes.length}`);
  lines.push(`- **Catalog-only codes:** ${report.snapshot.catalogOnlyCodes.length}`);
  lines.push(`- **Contentlayer built:** ${report.snapshot.build.contentlayerBuilt ? "Yes" : "No"}`);
  lines.push(`- **NEXTAUTH_URL set:** ${report.snapshot.build.nextauthUrlSet ? "Yes" : "No"}`);
  lines.push("");

  // ── GMI Edition States ──────────────────────────────────────────────────
  lines.push("## GMI Edition States");
  lines.push("");
  lines.push("| Edition | Registry | Lifecycle | Authority | Commercial | Resolver |");
  lines.push("|---------|----------|-----------|-----------|------------|----------|");
  for (const ed of report.snapshot.gmiEditions) {
    lines.push(
      `| ${ed.editionId} | ${ed.registryStatus}${ed.registryCurrent ? " (current)" : ""} | ` +
        `${ed.lifecycleState ?? "—"} | ${ed.authorityState ?? "—"} | ` +
        `${ed.commercialStatus ?? "—"} | ${ed.resolverAction ?? "—"} |`,
    );
  }
  lines.push("");

  // ── Content Families ────────────────────────────────────────────────────
  lines.push("## Content Families");
  lines.push("");
  lines.push("| Family | Source Files | Indexed | Public |");
  lines.push("|--------|-------------|---------|--------|");
  for (const f of report.snapshot.contentFamilies) {
    lines.push(`| ${f.family} | ${f.sourceFileCount} | ${f.indexedCount} | ${f.publicIndexedCount} |`);
  }
  lines.push("");

  // ── Conclusion ──────────────────────────────────────────────────────────
  lines.push("## Conclusion");
  lines.push("");
  if (report.exitCode === 0) {
    lines.push("✅ **All checks passed.** No unsafe contradictions detected.");
    lines.push("");
    if (report.summary.ownerDecisionsRequired > 0) {
      lines.push(`⚠️  ${report.summary.ownerDecisionsRequired} owner decision(s) are still pending but do not block deployment.`);
      lines.push("");
    }
    if (report.summary.informationalTensions > 0) {
      lines.push(`ℹ️  ${report.summary.informationalTensions} informational tension(s) detected — review at convenience.`);
      lines.push("");
    }
  } else {
    lines.push("❌ **Checks failed.** Unsafe contradictions detected that must be resolved before deployment.");
    lines.push("");
    lines.push(`🔴 ${report.summary.failures} failure(s) must be fixed.`);
    if (report.summary.checkoutBypasses > 0) {
      lines.push(`🔴 ${report.summary.checkoutBypasses} checkout bypass(es) detected — immediate action required.`);
    }
    lines.push("");
    lines.push("See sections above for details.");
  }

  lines.push("---");
  lines.push(`_Report generated by Living Intelligence Engine at ${report.timestamp}_`);
  lines.push("");

  return lines.join("\n");
}
