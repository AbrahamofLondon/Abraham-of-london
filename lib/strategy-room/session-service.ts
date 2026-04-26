/**
 * Strategy Room Session Service — Postgres-backed.
 *
 * Sessions survive restart. No in-memory state.
 * Uses existing StrategyRoomSession table via Neon.
 */

import { createStrategyRoomSession } from "./persistence";

export async function createStrategySession(input: {
  caseKey: string;
  operatorKey?: string;
  source: string;
  trigger?: string;
  instrumentResultId?: string;
  marketContextId?: string;
  spineId?: string;
}) {
  const { randomBytes } = require("crypto") as typeof import("crypto");
  const sessionKey = `str_${randomBytes(12).toString("hex")}`;

  await createStrategyRoomSession({
    sessionKey,
    status: "active",
    source: input.source,
    intake: JSON.stringify({
      caseKey: input.caseKey,
      operatorKey: input.operatorKey,
      trigger: input.trigger,
      instrumentResultId: input.instrumentResultId,
      marketContextId: input.marketContextId,
      spineId: input.spineId,
    }),
    canonicalSnapshot: null,
    route: null,
    readinessTier: null,
    authorityType: null,
  });

  return {
    sessionId: sessionKey,
    createdAt: new Date().toISOString(),
    ...input,
  };
}
