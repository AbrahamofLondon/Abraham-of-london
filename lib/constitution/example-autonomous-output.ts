import { runAutonomousAdvisory } from "./autonomous-advisory";

export function buildExampleAutonomousOutput() {
  return runAutonomousAdvisory({
    clarityScore: 72,
    authorityType: "DIRECT",
    readinessTier: "EXECUTION_READY",
    posture: "DRIFTING",
    failureModeCount: 2,
    failureModeSeverity: 6,
    narrativeCoherence: 68,
    interventionReadiness: 74,
    seriousnessScore: 82,
    mandateFit: true,
    trustCondition: 58,
    governanceDiscipline: 61,
    trajectoryContext: {
      urgency: 74,
      volatility: 57,
      deterioration: 63,
    },
  });
}