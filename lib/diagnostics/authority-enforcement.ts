/**
 * lib/diagnostics/authority-enforcement.ts — Server-side decision enforcement
 *
 * Enforces decision directives at the API/server boundary.
 * This is the hard gate — UI can be bypassed; this cannot.
 *
 * Authority hierarchy:
 *   1. Server-side durable thread (from DB via email) — sovereign, cannot be cleared by client
 *   2. Client-supplied tension thread — supplemental, used when no DB record exists
 *   3. No thread — first-time user, allowed
 *
 * Does NOT fail open. If prior diagnostics exist server-side,
 * client omission cannot downgrade enforcement.
 */

import type { TensionThread } from "./tension-thread";
import { deriveDecisionDirective, type DecisionDirective } from "./decision-authority";
import { retrieveDurableThread } from "./durable-thread";

export type EnforcementResult = {
  allowed: boolean;
  directive: DecisionDirective;
  reason: string;
  recommendedPath?: string;
  threadSource: "server" | "client" | "none";
};

/**
 * Enforce Strategy Room access. Async because it queries the database.
 *
 * @param email — user email from intake form (used to look up durable thread)
 * @param clientThreadJson — tension thread from client sessionStorage (supplemental)
 */
export async function enforceStrategyRoomAccess(
  email: string | null | undefined,
  clientThreadJson: unknown,
): Promise<EnforcementResult> {
  // 1. Try server-side durable thread first (sovereign — cannot be cleared by client)
  const durableThread = await retrieveDurableThread(email);

  // 2. Parse client-supplied thread as fallback
  const clientThread = parseThread(clientThreadJson);

  // 3. Authority hierarchy: server wins over client
  const thread = selectAuthoritative(durableThread, clientThread);
  const threadSource: "server" | "client" | "none" =
    durableThread && durableThread.tensions.length > 0
      ? "server"
      : clientThread && clientThread.tensions.length > 0
        ? "client"
        : "none";

  // 4. Derive directive from the authoritative thread
  if (thread && thread.tensions.length > 0) {
    const directive = deriveDecisionDirective(thread);

    if (directive.level === "block" || directive.level === "restrict") {
      return {
        allowed: false,
        directive,
        reason: directive.reason,
        recommendedPath: directive.recommendedPath || "/diagnostics",
        threadSource,
      };
    }

    return {
      allowed: true,
      directive,
      reason: directive.reason,
      threadSource,
    };
  }

  // 5. No thread from either source — first-time user
  return {
    allowed: true,
    directive: { level: "allow", reason: "No prior diagnostic context." },
    reason: "No prior diagnostic context.",
    threadSource: "none",
  };
}

/**
 * Select the authoritative thread. Server-side always wins.
 * If both exist, merge by taking the higher-severity result.
 */
function selectAuthoritative(
  serverThread: TensionThread | null,
  clientThread: TensionThread | null,
): TensionThread | null {
  // Server exists and has signals → server wins
  if (serverThread && serverThread.tensions.length > 0) {
    // If client also has signals, check if client has HIGHER escalation
    // (client may have accumulated more stages). Take the stricter one.
    if (clientThread && clientThread.tensions.length > 0) {
      const serverRank = ESCALATION_RANK[serverThread.escalationLevel] ?? 0;
      const clientRank = ESCALATION_RANK[clientThread.escalationLevel] ?? 0;
      return clientRank > serverRank ? clientThread : serverThread;
    }
    return serverThread;
  }

  // Server has nothing — use client
  if (clientThread && clientThread.tensions.length > 0) {
    return clientThread;
  }

  return null;
}

const ESCALATION_RANK: Record<string, number> = {
  none: 0,
  pattern_detected: 1,
  structural_risk: 2,
  intervention_required: 3,
};

/**
 * Parse and validate a tension thread from untrusted client input.
 */
function parseThread(input: unknown): TensionThread | null {
  if (!input) return null;

  try {
    const raw = typeof input === "string" ? JSON.parse(input) : input;

    if (!raw || typeof raw !== "object") return null;
    if (!Array.isArray((raw as any).tensions)) return null;
    if (typeof (raw as any).id !== "string") return null;
    if (typeof (raw as any).escalationLevel !== "string") return null;

    const tensions = (raw as any).tensions.filter(
      (t: any) =>
        typeof t?.signal === "string" &&
        typeof t?.severity === "string" &&
        typeof t?.source === "string" &&
        ["low", "medium", "high"].includes(t.severity),
    );

    return {
      id: (raw as any).id,
      createdAt: String((raw as any).createdAt || ""),
      updatedAt: String((raw as any).updatedAt || ""),
      stagesCompleted: Array.isArray((raw as any).stagesCompleted)
        ? (raw as any).stagesCompleted
        : [],
      tensions,
      dominantPatterns: Array.isArray((raw as any).dominantPatterns)
        ? (raw as any).dominantPatterns
        : [],
      escalationLevel: (raw as any).escalationLevel,
    } as TensionThread;
  } catch {
    return null;
  }
}
