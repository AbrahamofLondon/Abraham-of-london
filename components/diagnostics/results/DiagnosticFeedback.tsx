"use client";

import ProofCapturePrompt from "@/components/proof/ProofCapturePrompt";

export default function DiagnosticFeedback({
  stage,
  routeResultType,
}: {
  stage: string;
  routeResultType?: string;
}) {
  return (
    <ProofCapturePrompt
      sourceStage={stage}
      routeResultType={routeResultType}
      mode="immediate"
      compact
    />
  );
}
