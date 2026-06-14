/**
 * Decision Debt Ledger
 *
 * Persistent store for decision debt records.
 * Decision debt is recorded but never deleted.
 * Source events are audit-locked to prevent erasure.
 */

import fs from "fs";
import path from "path";
import type { DecisionDebtRecord } from "./decision-debt-contract";
import type { DecisionDebtRiskFramework } from "./decision-debt-risk-framework";
import { getApplicableFrameworks } from "./decision-debt-risk-framework";

const DEBT_ROOT = path.join(process.cwd(), "artifacts", "decision-debt");
const DEBT_INDEX = path.join(DEBT_ROOT, "index.json");

function ensureStorageExists() {
  if (!fs.existsSync(DEBT_ROOT)) {
    fs.mkdirSync(DEBT_ROOT, { recursive: true });
  }
  if (!fs.existsSync(DEBT_INDEX)) {
    fs.writeFileSync(DEBT_INDEX, JSON.stringify({}, null, 2));
  }
}

export class DecisionDebtLedger {
  constructor() {
    ensureStorageExists();
  }

  /**
   * Record a new decision debt
   */
  recordDecisionDebt(args: {
    caseId: string;
    organisationId?: string;
    sourceEventIds: string[];
    contradictionKeys: string[];
    debtCategory: DecisionDebtRecord["debtCategory"];
    operationalSeverity: "low" | "medium" | "high" | "critical";
    decisionDebtScore: number;
    confidence: "low" | "medium" | "high";
    calculationBasis: string[];
    estimatedFinancialRange?: {
      low: number;
      high: number;
      currency: string;
      basis: string;
    };
    auditLockIds: string[];
  }): DecisionDebtRecord | null {
    try {
      // Validate debt score range
      if (args.decisionDebtScore < 0 || args.decisionDebtScore > 100) {
        console.error("Decision debt score must be 0-100");
        return null;
      }

      // Require framework alignment
      const applicableFrameworks = getApplicableFrameworks(args.debtCategory);
      if (applicableFrameworks.length === 0) {
        console.error(
          `No applicable frameworks for debt category: ${args.debtCategory}`
        );
        return null;
      }

      // Require calculation basis
      if (!args.calculationBasis || args.calculationBasis.length === 0) {
        console.error("Decision debt must have calculation basis");
        return null;
      }

      // Guard against false precision
      if (args.estimatedFinancialRange) {
        // Financial range must have explicit basis
        if (
          !args.estimatedFinancialRange.basis ||
          args.estimatedFinancialRange.basis.length === 0
        ) {
          console.error("Financial range must include calculation basis");
          return null;
        }

        // Low confidence cannot use narrow ranges
        if (args.confidence === "low") {
          const rangePct =
            ((args.estimatedFinancialRange.high -
              args.estimatedFinancialRange.low) /
              args.estimatedFinancialRange.low) *
            100;
          if (rangePct < 30) {
            console.error(
              "Low confidence debt cannot use narrow range (must be 30%+ spread)"
            );
            return null;
          }
        }
      }

      const debtId = `debt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const record: DecisionDebtRecord = {
        debtId,
        caseId: args.caseId,
        organisationId: args.organisationId,
        sourceEventIds: args.sourceEventIds,
        contradictionKeys: args.contradictionKeys,
        debtCategory: args.debtCategory,
        alignedFrameworks: applicableFrameworks,
        operationalSeverity: args.operationalSeverity,
        decisionDebtScore: args.decisionDebtScore,
        confidence: args.confidence,
        calculationBasis: args.calculationBasis,
        unsupportedPrecisionBlocked: true,
        unresolvedSince: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        estimatedFinancialRange: args.estimatedFinancialRange,
        auditLockIds: args.auditLockIds,
      };

      this.writeDebtRecord(record);
      return record;
    } catch (error) {
      console.error("Failed to record decision debt:", error);
      return null;
    }
  }

  /**
   * Get all debt for a case
   */
  getDecisionDebtByCase(caseId: string): DecisionDebtRecord[] {
    try {
      const index = this.readIndex();
      return Object.values(index).filter((d: any) => d.caseId === caseId);
    } catch (error) {
      console.error("Failed to get debt by case:", error);
      return [];
    }
  }

  /**
   * Summarize debt for a case
   */
  summariseDecisionDebt(caseId: string): {
    totalDebtScore: number;
    debtCount: number;
    criticalCount: number;
    financialEstimateAvailable: boolean;
    estimatedRange?: { low: number; high: number; currency: string };
  } {
    const debts = this.getDecisionDebtByCase(caseId);

    const totalDebtScore = debts.reduce((sum, d) => sum + d.decisionDebtScore, 0);
    const criticalCount = debts.filter(
      (d) => d.operationalSeverity === "critical"
    ).length;

    // Find financial estimates with high confidence
    const financialEstimates = debts.filter(
      (d) => d.estimatedFinancialRange && d.confidence === "high"
    );

    let estimatedRange: { low: number; high: number; currency: string } | undefined;
    if (financialEstimates.length > 0) {
      const lowSum = financialEstimates.reduce(
        (sum, d) => sum + (d.estimatedFinancialRange?.low || 0),
        0
      );
      const highSum = financialEstimates.reduce(
        (sum, d) => sum + (d.estimatedFinancialRange?.high || 0),
        0
      );
      const firstEstimate = financialEstimates[0];
      if (firstEstimate && firstEstimate.estimatedFinancialRange) {
        estimatedRange = {
          low: lowSum,
          high: highSum,
          currency: firstEstimate.estimatedFinancialRange.currency,
        };
      }
    }

    return {
      totalDebtScore: Math.min(totalDebtScore, 100), // Cap at 100
      debtCount: debts.length,
      criticalCount,
      financialEstimateAvailable: !!estimatedRange,
      estimatedRange,
    };
  }

  /**
   * Private: write debt record
   */
  private writeDebtRecord(record: DecisionDebtRecord): void {
    try {
      const index = this.readIndex();
      index[record.debtId] = record;
      fs.writeFileSync(DEBT_INDEX, JSON.stringify(index, null, 2));
    } catch (error) {
      console.error("Failed to write debt record:", error);
    }
  }

  /**
   * Private: read index
   */
  private readIndex(): Record<string, DecisionDebtRecord> {
    try {
      if (fs.existsSync(DEBT_INDEX)) {
        const content = fs.readFileSync(DEBT_INDEX, "utf-8");
        return JSON.parse(content);
      }
      return {};
    } catch (error) {
      console.error("Failed to read debt index:", error);
      return {};
    }
  }
}

export default new DecisionDebtLedger();
