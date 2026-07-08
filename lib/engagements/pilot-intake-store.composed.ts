/**
 * lib/engagements/pilot-intake-store.composed.ts
 *
 * §12 — the composed PilotIntakeStore the runtime routes consume. It selects the adapter
 * by environment: PRODUCTION → Prisma/Postgres (durable, serverless-safe); otherwise →
 * SQLite (local/test). Adapters are DYNAMIC-imported so the production bundle never
 * statically pulls in better-sqlite3 (§16), and the SQLite guard's production fail-closed
 * remains authoritative. Pure helpers (toCustomerStatus, types) come from the DB-free
 * shared module. All methods are async so a single call site serves both adapters.
 */

import type { PilotIntake, QualificationResult } from "./operator-pilot-qualification";
import type { PilotIntakeRecord, PilotLifecycleState, PilotQueueItem } from "./pilot-intake-store.shared";
export { toCustomerStatus } from "./pilot-intake-store.shared";
export type { PilotIntakeRecord, PilotLifecycleState, PilotQueueItem, PilotCustomerStatus } from "./pilot-intake-store.shared";

function isProd(): boolean { return process.env.NODE_ENV === "production"; }

async function adapter() {
  return isProd() ? import("./pilot-intake-store.prisma") : import("./pilot-intake-store");
}

export async function savePilotIntake(intake: PilotIntake, qualification: QualificationResult): Promise<PilotIntakeRecord> {
  return (await adapter()).savePilotIntake(intake, qualification);
}

export async function getPilotIntakeByRef(reference: string): Promise<PilotIntakeRecord | null> {
  return (await adapter()).getPilotIntakeByRef(reference);
}

export async function listPilotQueue(opts: { status?: PilotLifecycleState; limit?: number } = {}): Promise<PilotQueueItem[]> {
  return (await adapter()).listPilotQueue(opts);
}

export async function transitionPilotState(
  reference: string,
  nextState: PilotLifecycleState,
  actor: { email: string | null; humanAuthority: boolean },
  details: { requestedInformation?: string | null; finalDecision?: string | null; operatorNote?: string | null; expectedUpdatedAt?: string } = {},
): Promise<PilotIntakeRecord | null> {
  return (await adapter()).transitionPilotState(reference, nextState, actor, details);
}
