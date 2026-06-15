/**
 * lib/living-intelligence/living-state-report-composer.ts
 *
 * Pure composers that turn evaluated LivingStateObjects + the view model into
 * the report payloads the runner writes to disk:
 *
 *   reports/living-state-objects.json     (the evaluated objects)
 *   reports/living-state-view-model.json  (the LivingStateViewModel)
 *   reports/living-state-summary.md       (human-readable summary)
 *
 * No I/O here — the runner owns reading/writing. These functions are pure so the
 * server and the .mjs script can share the same shapes.
 */

import type { LivingStateObject } from "@/lib/living-intelligence/living-state-object-contract";
import type { LivingStateViewModel } from "@/lib/living-intelligence/living-state-view-model";
import { LIVING_STATE_ENGINE_VERSION } from "@/lib/living-intelligence/living-state-view-model";

export type LivingStateObjectsPayload = {
  generatedAt: string;
  engineVersion: string;
  count: number;
  objects: LivingStateObject[];
};

export function composeLivingStateObjectsPayload(
  objects: LivingStateObject[],
  generatedAt: string = new Date().toISOString(),
): LivingStateObjectsPayload {
  return {
    generatedAt,
    engineVersion: LIVING_STATE_ENGINE_VERSION,
    count: objects.length,
    objects,
  };
}

function line(parts: Array<string | number>): string {
  return `| ${parts.join(" | ")} |`;
}

export function composeLivingStateSummaryMarkdown(
  viewModel: LivingStateViewModel,
): string {
  const out: string[] = [];
  out.push("# Living State — Estate Summary");
  out.push("");
  out.push(`Generated: ${viewModel.generatedAt}`);
  out.push(`Engine version: ${viewModel.engineVersion} (${LIVING_STATE_ENGINE_VERSION})`);
  out.push("");

  out.push("## Estate");
  out.push("");
  out.push(line(["Metric", "Value"]));
  out.push(line(["---", "---"]));
  out.push(line(["Total objects", viewModel.estate.totalObjects]));
  out.push(line(["Blocked", viewModel.estate.blocked]));
  out.push(line(["Warnings", viewModel.estate.warnings]));
  out.push(line(["Governed tensions", viewModel.estate.governedTensions]));
  out.push(line(["Safe to show user", viewModel.estate.safeToShowUser]));
  out.push(line(["Safe to show operator", viewModel.estate.safeToShowOperator]));
  out.push("");

  out.push("## By domain");
  out.push("");
  out.push(line(["Domain", "Total", "Blocked", "Await verify", "Await consent", "Artifact gap", "Missing route", "Ready for review"]));
  out.push(line(["---", "---", "---", "---", "---", "---", "---", "---"]));
  for (const [domain, r] of Object.entries(viewModel.byDomain)) {
    out.push(line([domain, r.total, r.blocked, r.awaitingVerification, r.awaitingConsent, r.artifactIncomplete, r.missingRepairRoute, r.readyForReview]));
  }
  out.push("");

  out.push("## Memory");
  out.push("");
  out.push(line(["Metric", "Value"]));
  out.push(line(["---", "---"]));
  out.push(line(["New issues", viewModel.memory.newIssues]));
  out.push(line(["Repeated issues", viewModel.memory.repeatedIssues]));
  out.push(line(["Resolved issues", viewModel.memory.resolvedIssues]));
  out.push(line(["Regressions", viewModel.memory.regressions]));
  out.push(line(["Remembered objects", viewModel.memory.rememberedObjects]));
  out.push("");

  if (viewModel.operatorFacing.length > 0) {
    out.push("## Operator-facing objects");
    out.push("");
    for (const op of viewModel.operatorFacing) {
      out.push(`### ${op.title} (${op.objectId})`);
      out.push("");
      out.push(op.summary);
      out.push("");
      if (op.blockers.length > 0) {
        out.push("**Blockers:**");
        for (const b of op.blockers) out.push(`- ${b}`);
        out.push("");
      }
      if (op.nextActions.length > 0) {
        out.push("**Next governed actions:**");
        for (const a of op.nextActions) out.push(`- ${a}`);
        out.push("");
      }
      if (op.missingRoutes.length > 0) {
        out.push("**Missing repair routes:**");
        for (const m of op.missingRoutes) out.push(`- ${m}`);
        out.push("");
      }
    }
  }

  if (viewModel.refusedToInfer.length > 0) {
    out.push("## Refused to infer");
    out.push("");
    for (const r of viewModel.refusedToInfer) out.push(`- ${r}`);
    out.push("");
  }

  return out.join("\n");
}
