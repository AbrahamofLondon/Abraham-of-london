// components/admin/reporting/ConstitutionalRecommendationPanel.tsx
"use client";

import * as React from "react";
import { ConstitutionalNarrativeBlock, type ConstitutionalNarrativeData } from "@/components/decision/ConstitutionalNarrativeBlock";
import { UnifiedRecommendationList, type UnifiedRecommendationCardData } from "@/components/decision/UnifiedRecommendationList";

export function ConstitutionalRecommendationPanel({
  constitution,
  recommendations,
  nextAction,
}: {
  constitution: ConstitutionalNarrativeData;
  recommendations: UnifiedRecommendationCardData[];
  nextAction?: string;
}) {
  return (
    <div className="space-y-6">
      <ConstitutionalNarrativeBlock
        constitution={constitution}
        nextAction={nextAction}
        variant="dark"
      />

      <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
        <UnifiedRecommendationList
          items={recommendations}
          variant="dark"
          title="Governed Recommendations"
          emptyText="No constitutionally suitable recommendations available."
        />
      </section>
    </div>
  );
}
