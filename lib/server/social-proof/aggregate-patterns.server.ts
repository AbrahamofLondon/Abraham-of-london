import "server-only";

import type { PurposeProfileResult } from "@/lib/alignment/types";

export function framePurposeSocialProof(result: PurposeProfileResult): string {
  const pattern = result.primaryPattern?.id;

  if (pattern === "false_alignment") {
    return "This pattern is common among high-capacity operators whose self-reading is ahead of their operating evidence.";
  }

  if (pattern === "acknowledged_failure") {
    return "This pattern often appears just before structural correction, when the problem is already known but action has not yet closed the gap.";
  }

  if (pattern === "pressure_override" || pattern === "operational_inconsistency") {
    return "This pattern appears repeatedly in operators with strong intent whose execution system is not yet defending that intent under pressure.";
  }

  if (result.severity === "high" || result.severity === "critical") {
    return "This is a familiar pre-correction pattern: clarity exists in parts of the system, but the structure is not holding under load.";
  }

  return "This pattern is not unusual among operators carrying real ambition before their structure fully catches up with their intent.";
}
