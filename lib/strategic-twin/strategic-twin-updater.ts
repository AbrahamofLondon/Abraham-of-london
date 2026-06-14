/**
 * Strategic Twin State Updater
 *
 * Modifies the Strategic Twin state safely.
 *
 * All updates are logged with source product, reasoning, and timestamp.
 * No update can erase history—only append.
 */

import fs from "fs";
import path from "path";
import {
  StrategicTwinState,
  StrategicTwinUpdate,
  StrategicTwinLineageEntry,
} from "./strategic-twin-contract";

const TWIN_ROOT = path.join(process.cwd(), "artifacts", "strategic-twin");
const TWIN_INDEX = path.join(TWIN_ROOT, "index.json");
const LINEAGE_DIR = path.join(TWIN_ROOT, "lineage");

function ensureStorageExists() {
  if (!fs.existsSync(TWIN_ROOT)) {
    fs.mkdirSync(TWIN_ROOT, { recursive: true });
  }
  if (!fs.existsSync(LINEAGE_DIR)) {
    fs.mkdirSync(LINEAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(TWIN_INDEX)) {
    fs.writeFileSync(TWIN_INDEX, JSON.stringify({}, null, 2));
  }
}

export class StrategicTwinStateUpdater {
  constructor() {
    ensureStorageExists();
  }

  /**
   * Initialize a new Strategic Twin state
   */
  initializeTwin(
    caseId: string,
    subjectType: "individual" | "team" | "organisation",
    subjectName?: string
  ): StrategicTwinState {
    const state: StrategicTwinState = {
      caseId,
      subjectType,
      subjectName,
      currentDecisionPressure: "low",
      activeDecisionTheme: undefined,
      dominantContradictions: [],
      activeEvidenceGaps: [],
      unresolvedCommitments: [],
      repeatedPatterns: [],
      currentInterventionReadiness: "not_ready",
      readinessReason: "Initial state",
      lastUpdatedAt: new Date().toISOString(),
      lastUpdatedByProductCode: undefined,
      stateConfidence: "low",
      confidenceReason: "No data yet",
      previousInterventionLevels: [],
      previousOutcomes: [],
    };

    this.writeTwinState(state);
    this.recordLineageEntry(caseId, "system", "initialize", "Twin initialized", "Initial creation");

    return state;
  }

  /**
   * Apply an update to the Strategic Twin
   */
  applyUpdate(update: StrategicTwinUpdate): StrategicTwinState | null {
    try {
      let state = this.readTwinState(update.caseId);

      if (!state) {
        // Initialize if doesn't exist
        const subjectType =
          update.updateType === "signal_detected" ? "individual" : "team";
        state = this.initializeTwin(update.caseId, subjectType as any);
      }

      // Apply changes
      if (update.contradictionChanges) {
        state.dominantContradictions = [
          ...state.dominantContradictions.filter(
            (c) => !update.contradictionChanges!.resolved.includes(c)
          ),
          ...update.contradictionChanges.added,
        ];
      }

      if (update.evidenceGapChanges) {
        state.activeEvidenceGaps = [
          ...state.activeEvidenceGaps.filter(
            (g) => !update.evidenceGapChanges!.resolved.includes(g)
          ),
          ...update.evidenceGapChanges.added,
        ];
      }

      if (update.commitmentChanges) {
        state.unresolvedCommitments = [
          ...state.unresolvedCommitments.filter(
            (c) =>
              !update.commitmentChanges!.completed.includes(c) &&
              !update.commitmentChanges!.abandoned.includes(c)
          ),
          ...update.commitmentChanges.added,
        ];
      }

      state.lastUpdatedAt = update.updateAt;
      state.lastUpdatedByProductCode = update.updatingProductCode;

      // Persist
      this.writeTwinState(state);
      this.recordLineageEntry(
        update.caseId,
        update.updatingProductCode,
        update.updateType,
        update.summary,
        update.reasoning
      );

      return state;
    } catch (error) {
      console.error(`Failed to apply update to ${update.caseId}:`, error);
      return null;
    }
  }

  /**
   * Update decision pressure
   */
  updateDecisionPressure(
    caseId: string,
    productCode: string,
    pressure: "low" | "medium" | "high" | "critical",
    reason: string
  ): StrategicTwinState | null {
    const state = this.readTwinState(caseId);
    if (!state) return null;

    state.currentDecisionPressure = pressure;
    state.lastUpdatedAt = new Date().toISOString();
    state.lastUpdatedByProductCode = productCode;

    this.writeTwinState(state);
    this.recordLineageEntry(
      caseId,
      productCode,
      "pressure_level_changed",
      `Pressure changed to ${pressure}`,
      reason
    );

    return state;
  }

  /**
   * Update intervention readiness
   */
  updateInterventionReadiness(
    caseId: string,
    productCode: string,
    readiness: "not_ready" | "signal_detected" | "evidence_needed" | "intervention_ready" | "execution_governance_required",
    reason: string
  ): StrategicTwinState | null {
    const state = this.readTwinState(caseId);
    if (!state) return null;

    state.currentInterventionReadiness = readiness;
    state.readinessReason = reason;
    state.lastUpdatedAt = new Date().toISOString();
    state.lastUpdatedByProductCode = productCode;

    this.writeTwinState(state);
    this.recordLineageEntry(
      caseId,
      productCode,
      "intervention_readiness_changed",
      `Readiness changed to ${readiness}`,
      reason
    );

    return state;
  }

  /**
   * Record an intervention completion
   */
  recordInterventionCompleted(
    caseId: string,
    productCode: string,
    interventionLevel: string,
    outcome: string
  ): StrategicTwinState | null {
    const state = this.readTwinState(caseId);
    if (!state) return null;

    state.previousInterventionLevels.push(interventionLevel);
    state.previousOutcomes.push(outcome);
    state.lastUpdatedAt = new Date().toISOString();
    state.lastUpdatedByProductCode = productCode;

    this.writeTwinState(state);
    this.recordLineageEntry(
      caseId,
      productCode,
      "intervention_completed",
      `${interventionLevel} completed`,
      outcome
    );

    return state;
  }

  /**
   * Get the lineage for a case
   */
  getLineage(caseId: string): StrategicTwinLineageEntry[] {
    try {
      const lineagePath = path.join(LINEAGE_DIR, `${caseId}.json`);
      if (fs.existsSync(lineagePath)) {
        const content = fs.readFileSync(lineagePath, "utf-8");
        return JSON.parse(content);
      }
      return [];
    } catch (error) {
      console.error(`Failed to get lineage for ${caseId}:`, error);
      return [];
    }
  }

  /**
   * Private: write twin state
   */
  private writeTwinState(state: StrategicTwinState): void {
    try {
      const index = this.readIndex();
      index[state.caseId] = state;
      fs.writeFileSync(TWIN_INDEX, JSON.stringify(index, null, 2));
    } catch (error) {
      console.error("Failed to write twin state:", error);
    }
  }

  /**
   * Private: read twin state
   */
  private readTwinState(caseId: string): StrategicTwinState | null {
    try {
      const index = this.readIndex();
      return index[caseId] || null;
    } catch (error) {
      console.error(`Failed to read twin state for ${caseId}:`, error);
      return null;
    }
  }

  /**
   * Private: read index
   */
  private readIndex(): Record<string, StrategicTwinState> {
    try {
      if (fs.existsSync(TWIN_INDEX)) {
        const content = fs.readFileSync(TWIN_INDEX, "utf-8");
        return JSON.parse(content);
      }
      return {};
    } catch (error) {
      console.error("Failed to read twin index:", error);
      return {};
    }
  }

  /**
   * Private: record a lineage entry
   */
  private recordLineageEntry(
    caseId: string,
    productCode: string,
    updateType: string,
    change: string,
    reason: string
  ): void {
    try {
      const lineagePath = path.join(LINEAGE_DIR, `${caseId}.json`);
      let lineage: StrategicTwinLineageEntry[] = [];

      if (fs.existsSync(lineagePath)) {
        const content = fs.readFileSync(lineagePath, "utf-8");
        lineage = JSON.parse(content);
      }

      lineage.push({
        timestamp: new Date().toISOString(),
        updatingProductCode: productCode,
        updateType,
        change,
        reason,
      });

      fs.writeFileSync(lineagePath, JSON.stringify(lineage, null, 2));
    } catch (error) {
      console.error(`Failed to record lineage for ${caseId}:`, error);
    }
  }
}

export default new StrategicTwinStateUpdater();
