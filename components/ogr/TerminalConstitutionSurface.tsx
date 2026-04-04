// components/ogr/TerminalConstitutionSurface.tsx
"use client";

import * as React from "react";
import { ConstitutionalNarrativeBlock } from "@/components/decision/ConstitutionalNarrativeBlock";
import { UnifiedRecommendationList } from "@/components/decision/UnifiedRecommendationList";
import type { CanonicalSections } from "@/lib/decision/canonical-sections";

export function TerminalConstitutionSurface({
  sections,
}: {
  sections: CanonicalSections;
}) {
  const posture = sections.constitutionalPosture;
  const governed = sections.governedRecommendations;

  return (
    <div className="space-y-6">
      <ConstitutionalNarrativeBlock
        constitution={posture}
        nextAction={governed.nextAction}
        variant="dark"
        compact
      />

      <div className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(14,14,15,0.96)_0%,rgba(7,7,8,0.98)_100%)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
        <UnifiedRecommendationList
          items={governed.recommendations}
          variant="dark"
          title="Governed Recommendations"
          emptyText="No governed recommendations available for the current constitutional posture."
        />
      </div>
    </div>
  );
}