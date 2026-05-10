import { NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import {
  getFunnelProgression,
  getDropOffMap,
  getFlagshipConversionRate,
  getEvidenceCompletionRate,
  getEscalationQualificationRate,
  getBuyerPathEfficiency,
  getRevenueByPath,
  getStrategyRoomQualification,
  getConversionIntelligenceMetrics,
} from "@/lib/analytics/decision-journey";

export async function GET() {
  const auth = await requireAdminAppRoute();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const range = {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date(),
    };

    const [
      funnel,
      dropOff,
      flagshipConversion,
      evidenceCompletion,
      escalationQualification,
      buyerEfficiency,
      revenueByPath,
      strategyQualification,
      conversionIntelligence,
    ] = await Promise.all([
      getFunnelProgression(range),
      getDropOffMap(range),
      getFlagshipConversionRate(range),
      getEvidenceCompletionRate(range),
      getEscalationQualificationRate(range),
      getBuyerPathEfficiency(range),
      getRevenueByPath(range),
      getStrategyRoomQualification(range),
      getConversionIntelligenceMetrics(range),
    ]);

    return NextResponse.json({
      period: { from: range.from.toISOString(), to: range.to.toISOString() },
      funnel,
      dropOff,
      flagshipConversion,
      evidenceCompletion,
      escalationQualification,
      buyerEfficiency,
      revenueByPath,
      strategyQualification,
      conversionIntelligence,
    });
  } catch (err) {
    console.error("[decision-intelligence]", err);
    return NextResponse.json(
      { error: "Failed to load decision intelligence data" },
      { status: 500 },
    );
  }
}
