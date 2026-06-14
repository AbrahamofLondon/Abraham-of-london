/**
 * Decision Debt Risk Framework
 *
 * Aligns decision debt calculations to recognized governance and risk frameworks.
 * Decision Debt must not present invented precision.
 * All decision debt must map to one or more recognized frameworks.
 *
 * If the basis is weak, record which framework(s) apply and show confidence as low.
 * If the basis is strong, show alignment to specific framework control objectives.
 */

export type DecisionDebtRiskFramework =
  | "COSO_ERM_GOVERNANCE_AND_CULTURE"
  | "COSO_ERM_STRATEGY_AND_OBJECTIVE_SETTING"
  | "COSO_ERM_PERFORMANCE"
  | "COSO_ERM_REVIEW_AND_REVISION"
  | "COSO_ERM_INFORMATION_COMMUNICATION_REPORTING"
  | "ISO_31000_RISK_IDENTIFICATION"
  | "ISO_31000_RISK_ANALYSIS"
  | "ISO_31000_RISK_EVALUATION"
  | "ISO_31000_RISK_TREATMENT"
  | "OPERATIONAL_RESILIENCE"
  | "PROJECT_SLIPPAGE"
  | "GOVERNANCE_EXPOSURE"
  | "REGULATORY_EXPOSURE"
  | "COMMERCIAL_EXECUTION_RISK";

export interface RiskFrameworkDefinition {
  frameworkId: DecisionDebtRiskFramework;
  frameworkName: string;
  frameworkSource: string;
  controlObjective: string;
  applicableTo: DecisionDebtCategory[];
}

export type DecisionDebtCategory =
  | "execution_delay"
  | "mandate_fracture"
  | "evidence_gap"
  | "governance_exposure"
  | "project_slippage"
  | "commercial_misalignment"
  | "regulatory_risk"
  | "leadership_drift";

export const RISK_FRAMEWORK_DEFINITIONS: Record<
  DecisionDebtRiskFramework,
  RiskFrameworkDefinition
> = {
  COSO_ERM_GOVERNANCE_AND_CULTURE: {
    frameworkId: "COSO_ERM_GOVERNANCE_AND_CULTURE",
    frameworkName: "COSO ERM Governance and Culture",
    frameworkSource: "COSO Enterprise Risk Management Framework",
    controlObjective:
      "Board and management establish tone at top; embed ethics; establish accountability",
    applicableTo: [
      "mandate_fracture",
      "leadership_drift",
      "governance_exposure",
    ],
  },
  COSO_ERM_STRATEGY_AND_OBJECTIVE_SETTING: {
    frameworkId: "COSO_ERM_STRATEGY_AND_OBJECTIVE_SETTING",
    frameworkName: "COSO ERM Strategy and Objective Setting",
    frameworkSource: "COSO Enterprise Risk Management Framework",
    controlObjective:
      "Strategy and objectives are set and aligned with risk appetite; business objectives are defined",
    applicableTo: [
      "evidence_gap",
      "commercial_misalignment",
      "execution_delay",
    ],
  },
  COSO_ERM_PERFORMANCE: {
    frameworkId: "COSO_ERM_PERFORMANCE",
    frameworkName: "COSO ERM Performance",
    frameworkSource: "COSO Enterprise Risk Management Framework",
    controlObjective:
      "Events are identified and assessed; responses are selected and implemented",
    applicableTo: [
      "execution_delay",
      "project_slippage",
      "governance_exposure",
    ],
  },
  COSO_ERM_REVIEW_AND_REVISION: {
    frameworkId: "COSO_ERM_REVIEW_AND_REVISION",
    frameworkName: "COSO ERM Review and Revision",
    frameworkSource: "COSO Enterprise Risk Management Framework",
    controlObjective:
      "Monitoring evaluates whether ERM is present and functioning; changes are made as needed",
    applicableTo: [
      "evidence_gap",
      "mandate_fracture",
      "leadership_drift",
    ],
  },
  COSO_ERM_INFORMATION_COMMUNICATION_REPORTING: {
    frameworkId: "COSO_ERM_INFORMATION_COMMUNICATION_REPORTING",
    frameworkName: "COSO ERM Information, Communication, and Reporting",
    frameworkSource: "COSO Enterprise Risk Management Framework",
    controlObjective:
      "Relevant information is identified, captured, and communicated; external requirements are met",
    applicableTo: [
      "governance_exposure",
      "regulatory_risk",
      "evidence_gap",
    ],
  },
  ISO_31000_RISK_IDENTIFICATION: {
    frameworkId: "ISO_31000_RISK_IDENTIFICATION",
    frameworkName: "ISO 31000 Risk Identification",
    frameworkSource: "ISO 31000:2018 Risk Management Standard",
    controlObjective:
      "Identify risks that might affect achievement of objectives; determine what could happen and why",
    applicableTo: [
      "evidence_gap",
      "project_slippage",
      "execution_delay",
    ],
  },
  ISO_31000_RISK_ANALYSIS: {
    frameworkId: "ISO_31000_RISK_ANALYSIS",
    frameworkName: "ISO 31000 Risk Analysis",
    frameworkSource: "ISO 31000:2018 Risk Management Standard",
    controlObjective:
      "Analyze identified risks; understand nature and level of risk; determine potential consequences and likelihood",
    applicableTo: [
      "commercial_misalignment",
      "regulatory_risk",
      "governance_exposure",
    ],
  },
  ISO_31000_RISK_EVALUATION: {
    frameworkId: "ISO_31000_RISK_EVALUATION",
    frameworkName: "ISO 31000 Risk Evaluation",
    frameworkSource: "ISO 31000:2018 Risk Management Standard",
    controlObjective:
      "Compare analyzed risks against risk criteria; priorities are established",
    applicableTo: [
      "execution_delay",
      "project_slippage",
      "governance_exposure",
    ],
  },
  ISO_31000_RISK_TREATMENT: {
    frameworkId: "ISO_31000_RISK_TREATMENT",
    frameworkName: "ISO 31000 Risk Treatment",
    frameworkSource: "ISO 31000:2018 Risk Management Standard",
    controlObjective:
      "Select and implement options for addressing risks; options include avoid, mitigate, transfer, accept",
    applicableTo: [
      "evidence_gap",
      "mandate_fracture",
      "execution_delay",
    ],
  },
  OPERATIONAL_RESILIENCE: {
    frameworkId: "OPERATIONAL_RESILIENCE",
    frameworkName: "Operational Resilience",
    frameworkSource:
      "FCA/PRA Operational Resilience Regulatory Framework (UK/EU derivative)",
    controlObjective:
      "Identify, understand, and manage impacts of disruptions; critical business services remain operational",
    applicableTo: [
      "execution_delay",
      "project_slippage",
      "governance_exposure",
    ],
  },
  PROJECT_SLIPPAGE: {
    frameworkId: "PROJECT_SLIPPAGE",
    frameworkName: "Project Management Delivery Risk",
    frameworkSource: "PMI/PRINCE2 Framework Context",
    controlObjective:
      "Projects deliver on time, within scope, within budget; dependencies and constraints are managed",
    applicableTo: ["project_slippage", "execution_delay"],
  },
  GOVERNANCE_EXPOSURE: {
    frameworkId: "GOVERNANCE_EXPOSURE",
    frameworkName: "Governance and Control Risk",
    frameworkSource: "Internal Control Framework Context",
    controlObjective:
      "Governance structures, authorities, and controls operate as designed; decisions are documented and traceable",
    applicableTo: [
      "mandate_fracture",
      "leadership_drift",
      "governance_exposure",
    ],
  },
  REGULATORY_EXPOSURE: {
    frameworkId: "REGULATORY_EXPOSURE",
    frameworkName: "Regulatory Compliance Risk",
    frameworkSource: "Regulatory Compliance Framework Context",
    controlObjective:
      "Organization complies with applicable laws and regulations; regulatory requirements are met",
    applicableTo: ["regulatory_risk", "governance_exposure"],
  },
  COMMERCIAL_EXECUTION_RISK: {
    frameworkId: "COMMERCIAL_EXECUTION_RISK",
    frameworkName: "Commercial Execution Risk",
    frameworkSource: "Commercial Strategy Framework Context",
    controlObjective:
      "Commercial initiatives are executed successfully; revenue/margin targets are achieved; customer commitments are met",
    applicableTo: [
      "commercial_misalignment",
      "execution_delay",
      "project_slippage",
    ],
  },
};

/**
 * Get frameworks applicable to a decision debt category
 */
export function getApplicableFrameworks(
  category: DecisionDebtCategory
): DecisionDebtRiskFramework[] {
  return Object.entries(RISK_FRAMEWORK_DEFINITIONS)
    .filter(([_, def]) => def.applicableTo.includes(category))
    .map(([id]) => id as DecisionDebtRiskFramework);
}

/**
 * Invariants
 */
export const DECISION_DEBT_FRAMEWORK_INVARIANTS = {
  FRAMEWORK_REQUIRED:
    "Every decision debt must map to one or more recognized frameworks",
  NO_INVENTED_PRECISION:
    "Do not present invented financial precision; show score-only or range-only with low confidence if basis is weak",
  CONFIDENCE_REFLECTS_BASIS:
    "Confidence level must reflect the strength of the calculation basis",
  CFO_VALUE_IS_MEASUREMENT:
    "CFO/board value is that unresolved contradiction carries measurable debt, not AI-invented numbers",
};
