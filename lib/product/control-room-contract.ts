import type {
  AdmissionReadiness,
  AggregationSafety,
  MultiUserCampaignSummary,
  OrganisationScope,
} from "@/lib/product/multi-user-contract";
import type { CollisionSummary } from "@/lib/product/multi-user-collision-summary";
import type { EvidenceTier } from "@/lib/product/living-intelligence-spine";
import type { OversightCycleAudience } from "@/lib/product/oversight-cycle-ledger-contract";
import type { GovernanceEvidenceCoverage } from "@/lib/product/governed-memory-contract";

export type ControlRoomState = {
  organisationId: string;
  organisationName: string;
  scope: OrganisationScope;
  currentState: {
    activeCampaigns: number;
    responseCoverage: number;
    evidenceTier: EvidenceTier | string;
    aggregationSafety: AggregationSafety;
    primaryRisk?: string;
    governanceEvidenceCoverage?: GovernanceEvidenceCoverage;
  };
  campaigns: MultiUserCampaignSummary[];
  divergence: CollisionSummary[];
  admissions: AdmissionReadiness & {
    boardroom: "QUALIFIED" | "NOT_QUALIFIED" | "NOT_EVALUATED";
  };
  nextRequiredAction?: string;
  privacyNotice: string;
  safeAudiences?: OversightCycleAudience[];
  purposeAlignment?: Record<string, unknown> | null;
};
