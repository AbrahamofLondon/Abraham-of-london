/**
 * lib/product/personal-decision-audit-renderer.ts
 *
 * Renders DecisionDiagnosticOutput into customer-facing text and benchmark-analyzable structure.
 *
 * Ensures upgraded fields (trade-off, consequence, falsification) are prominently surfaced,
 * not buried in metadata.
 */

import { DecisionDiagnosticOutput } from "./decision-diagnostic-composer";
import { AnalyzableOutput } from "./anti-toy-product-test";

/**
 * Render diagnostic output to customer-facing text
 */
export function renderDecisionDiagnosticText(output: DecisionDiagnosticOutput): string {
  return `
DECISION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${output.actualDecisionQuestion}

WHAT MAKES THIS DECISION HARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${output.decisionTension}

THE HIDDEN ASSUMPTION UNDER TEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${output.unresolvedAssumption}

HOW TO TEST IF THIS JUDGMENT IS WRONG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Claim: ${output.falsificationTest.claim}

Observable Test: ${output.falsificationTest.challenge}

If This Evidence Emerges, the Judgment Changes:
${output.falsificationTest.evidenceThatWouldChangeJudgement}

THE NEXT MOVE (ACCOUNTABLE AND TIMED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Action: ${output.accountableNextMove.action}
Owner: ${output.accountableNextMove.owner}
Deadline: ${output.accountableNextMove.deadline}
Success Check: ${output.accountableNextMove.successCheck}

THE CONSEQUENCE OF DELAY OR WRONG CHOICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${output.consequenceIfWrong}

WHAT NOT TO DO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${output.whatNotToDo}

WHEN TO RE-DECIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${output.escalationTrigger}

LIMITATIONS OF THIS DIAGNOSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${output.limitation}
`.trim();
}

/**
 * Convert DecisionDiagnosticOutput to AnalyzableOutput for benchmark testing
 */
export function renderForBenchmark(output: DecisionDiagnosticOutput): AnalyzableOutput {
  const fullText = renderDecisionDiagnosticText(output);

  // Extract the diagnosis/judgement section
  const diagnosisText = output.diagnosticJudgement;

  // Extract next action as prominent text
  const nextActionText = `Action: ${output.accountableNextMove.action}
Owner: ${output.accountableNextMove.owner}
Deadline: ${output.accountableNextMove.deadline}
Success Check: ${output.accountableNextMove.successCheck}`;

  // Extract consequence as prominent text
  const consequenceText = output.consequenceIfWrong;

  // Extract falsification test
  const falsificationText = `${output.falsificationTest.challenge}

Evidence that would change judgment:
${output.falsificationTest.evidenceThatWouldChangeJudgement}`;

  // Extract execution sequence from next move
  const executionSequenceText = [
    output.accountableNextMove.action,
    `By deadline: ${output.accountableNextMove.deadline}`,
    `Success when: ${output.accountableNextMove.successCheck}`,
  ];

  // Limits text
  const limitsText = output.limitation;

  // Evidence items extracted from reasoning chain
  const evidenceItems = [
    ...output.reasoningChainEvidence.interpretedSignals,
    ...output.reasoningChainEvidence.weightedSignals,
    ...output.reasoningChainEvidence.patterns,
  ].filter((item) => item && item.trim().length > 0);

  return {
    fullText,
    diagnosisText,
    nextActionText,
    consequenceText,
    falsificationText,
    executionSequenceText,
    limitsText,
    evidenceItems,
  };
}

export default {
  renderDecisionDiagnosticText,
  renderForBenchmark,
};
