// app/actions/deploy-intervention.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { evaluateConstitutionalRoute, type ConstitutionInput } from "@/lib/constitution/rules";

interface DeployInterventionParams {
  organisationId: string;
  campaignId?: string;
  domain: string;
  baselineScore: number;
  urgency: "immediate" | "scheduled";
  // Constitutional context from Strategy Room / intake
  clarityScore?: number;
  authorityType?: "DIRECT" | "PROXY" | "UNCLEAR";
  readinessTier?: "FRAGILE" | "EMERGING" | "STABILIZING" | "EXECUTION_READY" | "SOVEREIGN";
  failureModeCount?: number;
  failureModeSeverity?: number;
  narrativeCoherence?: number;
  interventionReadiness?: number;
}

export async function deployIntervention(params: DeployInterventionParams) {
  const {
    organisationId,
    campaignId,
    domain,
    baselineScore,
    urgency,
    clarityScore = 50,
    authorityType = "PROXY",
    readinessTier = "EMERGING",
    failureModeCount = 1,
    failureModeSeverity = 5,
    narrativeCoherence = 60,
    interventionReadiness = baselineScore,
  } = params;

  try {
    // === Constitutional Gate – Zero or minimal error margin ===
    const constitutionInput: ConstitutionInput = {
      clarityScore,
      authorityType,
      readinessTier,
      posture: "DRIFTING", // Derive dynamically in production from full context
      failureModeCount,
      failureModeSeverity,
      narrativeCoherence,
      interventionReadiness,
    };

    const constitutionalCheck = evaluateConstitutionalRoute(constitutionInput);

    if (constitutionalCheck.route === "REJECT") {
      return {
        success: false,
        error: "Deployment blocked by constitutional rules.",
        route: constitutionalCheck.route,
        disqualifiers: constitutionalCheck.disqualifiersTriggered,
        rationale: constitutionalCheck.rationale,
      };
    }

    // Proceed only if Constitution allows
    const result = await prisma.$transaction(async (tx) => {
      // Create the strategic intervention using the correct model name
      const intervention = await tx.strategicIntervention.create({
        data: {
          organisationId,
          campaignId: campaignId || null,
          domain,
          baselineScore,
          status: urgency === "immediate" ? "ACTIVE" : "PENDING",
          deployedAt: urgency === "immediate" ? new Date() : null,
        },
      });

      // Create correction nodes for each recommended intervention
      const correctionNodes = await Promise.all(
        constitutionalCheck.recommendedInterventions.map((title, index) =>
          tx.correctionNode.create({
            data: {
              interventionId: intervention.id,
              campaignId: campaignId || null,
              title,
              description: `Constitutionally derived intervention for ${domain}. Based on score: ${baselineScore}%. Confidence: ${(constitutionalCheck.confidence * 100).toFixed(0)}%`,
              priority: index === 0 ? "HIGH" : index === 1 ? "MEDIUM" : "LOW",
              status: "OPEN",
            },
          })
        )
      );

      return {
        ...intervention,
        correctionNodes,
      };
    });

    // Revalidate dashboards
    revalidatePath(`/admin/organisations/${organisationId}/dashboard`);
    revalidatePath(`/admin/organisations/${organisationId}/interventions`);
    if (campaignId) {
      revalidatePath(`/admin/campaigns/${campaignId}`);
    }

    return {
      success: true,
      data: result,
      constitutionalRoute: constitutionalCheck.route,
      confidence: constitutionalCheck.confidence,
      rationale: constitutionalCheck.rationale,
    };
  } catch (error) {
    console.error("FAILED_TO_DEPLOY_INTERVENTION:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Protocol deployment failed. Constitutional safeguards prevented inconsistent state.",
    };
  }
}