import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { runTeamAssessmentTruthHarness } from "../../lib/intelligence/product-truth-harness/team-assessment";

const REPORTS_DIR = join(process.cwd(), "reports");
const REPORT_PATH = join(REPORTS_DIR, "team-assessment-truth-harness.json");
const MARKDOWN_PATH = join(REPORTS_DIR, "team-assessment-truth-harness.md");

function renderMarkdown(report: Awaited<ReturnType<typeof runTeamAssessmentTruthHarness>>): string {
  return `# Team Assessment Truth Harness

Generated: ${report.generatedAt}

Surface: ${report.surface}

Passed: ${report.passed ? "YES" : "NO"}

## Cases

${report.cases
  .map(
    (caseRun) => `- ${caseRun.id} (${caseRun.kind}) — ${caseRun.passed ? "passed" : "failed"}
  - Observed judgement score: ${caseRun.observedJudgementScore}
  - Allowed release score: ${caseRun.allowedReleaseScore}
  - Effective ceiling: ${caseRun.effectiveCeiling}
  - Violations: ${caseRun.violationReasons.length > 0 ? caseRun.violationReasons.join("; ") : "None"}`,
  )
  .join("\n")}
`;
}

export async function main(): Promise<void> {
  const report = await runTeamAssessmentTruthHarness();

  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(MARKDOWN_PATH, renderMarkdown(report), "utf8");

  console.log("TEAM ASSESSMENT TRUTH HARNESS");
  console.log(`Passed: ${report.passed ? "YES" : "NO"}`);
  console.log(`Cases: ${report.cases.length}`);
  console.log(`Surface: ${report.surface}`);
  console.log("Report written: reports/team-assessment-truth-harness.json");

  if (!report.passed) {
    console.log("\nFailing cases:");
    for (const entry of report.cases.filter((caseRun) => !caseRun.passed)) {
      console.log(`  - ${entry.id} (${entry.kind})`);
      for (const reason of entry.violationReasons) {
        console.log(`      * ${reason}`);
      }
    }
  }

  process.exit(report.passed ? 0 : 1);
}
