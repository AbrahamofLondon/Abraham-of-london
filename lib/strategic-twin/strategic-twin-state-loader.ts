/**
 * Strategic Twin State Loader
 *
 * Reads and reconstructs the Strategic Twin state for a case.
 *
 * The Strategic Twin is the single source of truth for a user/team/org's
 * decision context, contradictions, evidence gaps, and intervention readiness.
 */

import fs from "fs";
import path from "path";
import { StrategicTwinState, StrategicTwinReadIntent } from "./strategic-twin-contract";

const TWIN_ROOT = path.join(process.cwd(), "artifacts", "strategic-twin");
const TWIN_INDEX = path.join(TWIN_ROOT, "index.json");
const READ_INTENT_LOG = path.join(TWIN_ROOT, "read-intents.json");

function ensureStorageExists() {
  if (!fs.existsSync(TWIN_ROOT)) {
    fs.mkdirSync(TWIN_ROOT, { recursive: true });
  }
  if (!fs.existsSync(TWIN_INDEX)) {
    fs.writeFileSync(TWIN_INDEX, JSON.stringify({}, null, 2));
  }
  if (!fs.existsSync(READ_INTENT_LOG)) {
    fs.writeFileSync(READ_INTENT_LOG, JSON.stringify([], null, 2));
  }
}

export class StrategicTwinStateLoader {
  constructor() {
    ensureStorageExists();
  }

  /**
   * Load the Strategic Twin state for a specific case
   */
  loadTwinState(caseId: string): StrategicTwinState | null {
    try {
      const index = this.readIndex();
      return index[caseId] || null;
    } catch (error) {
      console.error(`Failed to load twin state for ${caseId}:`, error);
      return null;
    }
  }

  /**
   * Load twin state with read intent declaration
   * Required: all reads must declare intent
   */
  loadWithIntent(
    caseId: string,
    productCode: string,
    intentType: StrategicTwinReadIntent["intentType"],
    intendedAction: string
  ): StrategicTwinState | null {
    // Log the read intent
    const intent: StrategicTwinReadIntent = {
      productCode,
      caseId,
      readAt: new Date().toISOString(),
      intentType,
      intendedAction,
      willUpdateState: false,
    };

    this.logReadIntent(intent);

    // Return the state
    return this.loadTwinState(caseId);
  }

  /**
   * Get all cases managed in the Strategic Twin
   */
  getAllCaseIds(): string[] {
    try {
      const index = this.readIndex();
      return Object.keys(index);
    } catch (error) {
      console.error("Failed to get case IDs:", error);
      return [];
    }
  }

  /**
   * Get read history for a case
   */
  getReadHistory(caseId: string): StrategicTwinReadIntent[] {
    try {
      const intents = this.readIntents();
      return intents.filter((intent) => intent.caseId === caseId);
    } catch (error) {
      console.error(`Failed to get read history for ${caseId}:`, error);
      return [];
    }
  }

  /**
   * Get read history by product
   */
  getProductAccessHistory(
    productCode: string
  ): StrategicTwinReadIntent[] {
    try {
      const intents = this.readIntents();
      return intents.filter((intent) => intent.productCode === productCode);
    } catch (error) {
      console.error(
        `Failed to get access history for ${productCode}:`,
        error
      );
      return [];
    }
  }

  /**
   * Check if a product has read a specific case
   */
  hasProductRead(
    caseId: string,
    productCode: string
  ): boolean {
    const history = this.getReadHistory(caseId);
    return history.some((h) => h.productCode === productCode);
  }

  /**
   * Get last read timestamp for a case
   */
  getLastReadAt(caseId: string): string | null {
    const history = this.getReadHistory(caseId);
    if (!history || history.length === 0) return null;
    const lastEntry = history[history.length - 1];
    return lastEntry ? lastEntry.readAt : null;
  }

  /**
   * Get statistics about Strategic Twin state
   */
  getStats(): {
    totalCases: number;
    totalReads: number;
    productsAccessingTwin: number;
    casesBySubjectType: Record<string, number>;
  } {
    try {
      const index = this.readIndex();
      const intents = this.readIntents();

      const productsSet = new Set<string>();
      intents.forEach((intent) => productsSet.add(intent.productCode));

      const casesByType: Record<string, number> = {};
      Object.values(index).forEach((state: StrategicTwinState) => {
        casesByType[state.subjectType] = (casesByType[state.subjectType] || 0) + 1;
      });

      return {
        totalCases: Object.keys(index).length,
        totalReads: intents.length,
        productsAccessingTwin: productsSet.size,
        casesBySubjectType: casesByType,
      };
    } catch (error) {
      console.error("Failed to get stats:", error);
      return {
        totalCases: 0,
        totalReads: 0,
        productsAccessingTwin: 0,
        casesBySubjectType: {},
      };
    }
  }

  /**
   * Private: log a read intent
   */
  private logReadIntent(intent: StrategicTwinReadIntent): void {
    try {
      const intents = this.readIntents();
      intents.push(intent);
      fs.writeFileSync(READ_INTENT_LOG, JSON.stringify(intents, null, 2));
    } catch (error) {
      console.error("Failed to log read intent:", error);
    }
  }

  /**
   * Private: read the index
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
   * Private: read intents log
   */
  private readIntents(): StrategicTwinReadIntent[] {
    try {
      if (fs.existsSync(READ_INTENT_LOG)) {
        const content = fs.readFileSync(READ_INTENT_LOG, "utf-8");
        return JSON.parse(content);
      }
      return [];
    } catch (error) {
      console.error("Failed to read intents:", error);
      return [];
    }
  }
}

export default new StrategicTwinStateLoader();
