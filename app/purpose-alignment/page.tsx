export const dynamic = "force-dynamic";

import PurposeAlignmentAssessment from "@/components/alignment/PurposeAlignmentAssessment";

export default function PurposeAlignmentPage() {
  // This remains a live parallel/support surface. It is not the canonical
  // Stage 1 entry, which currently routes through /diagnostics/constitutional-diagnostic.
  return <PurposeAlignmentAssessment />;
}
