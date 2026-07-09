import { prisma } from "@/lib/prisma";
import {
  hashSignalContinuation,
  isSignalContinuationExpired,
  newSignalContinuationToken,
  newSignalInteractionId,
  SIGNAL_CONTINUATION_TOKEN_RE,
  SIGNAL_RECOMMENDATION_RE,
  type SignalContinuationRecord,
  type SignalContinuationState,
} from "./signal-consent-transition-store.shared";

function toRecord(row: {
  token: string; recommendationId: string; sessionId: string; mode: string; state: string; createdAt: Date; updatedAt: Date; expiresAt: Date;
  tenantId: string | null; subjectId: string | null; consentCapturedAt: Date | null; caseId: string | null; interactionId: string | null; twinVersion: number | null; stateHash: string;
}): SignalContinuationRecord {
  return {
    token: row.token,
    recommendationId: row.recommendationId,
    sessionId: row.sessionId,
    mode: row.mode as "LIVE" | "EXAMPLE",
    state: row.state as SignalContinuationState,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    tenantId: row.tenantId,
    subjectId: row.subjectId,
    consentCapturedAt: row.consentCapturedAt?.toISOString() ?? null,
    caseId: row.caseId,
    interactionId: row.interactionId,
    twinVersion: row.twinVersion,
    stateHash: row.stateHash,
  };
}

export async function requestSignalContinuation(input: { recommendationId: string; sessionId: string; mode: "LIVE" | "EXAMPLE"; ttlMinutes?: number }, now = new Date().toISOString()): Promise<SignalContinuationRecord> {
  if (input.mode !== "LIVE") throw new Error("Example readings cannot become customer history");
  if (!SIGNAL_RECOMMENDATION_RE.test(input.recommendationId)) throw new Error("Invalid recommendation id");
  const createdAt = new Date(now);
  const expiresAt = new Date(Date.parse(now) + (input.ttlMinutes ?? 30) * 60000);
  const token = newSignalContinuationToken();
  const row = await prisma.signalConsentContinuation.create({
    data: {
      token,
      recommendationId: input.recommendationId,
      sessionId: input.sessionId,
      mode: input.mode,
      state: "CONTINUE_REQUESTED",
      createdAt,
      updatedAt: createdAt,
      expiresAt,
      stateHash: hashSignalContinuation({ recommendationId: input.recommendationId, sessionId: input.sessionId, expiresAt: expiresAt.toISOString() }),
    },
  });
  return toRecord(row);
}

export async function getSignalContinuation(tokenValue: string): Promise<SignalContinuationRecord | null> {
  if (!SIGNAL_CONTINUATION_TOKEN_RE.test(tokenValue)) return null;
  const row = await prisma.signalConsentContinuation.findUnique({ where: { token: tokenValue } });
  return row ? toRecord(row) : null;
}

async function update(record: SignalContinuationRecord, patch: Partial<SignalContinuationRecord>, now: string): Promise<SignalContinuationRecord> {
  const next = { ...record, ...patch, updatedAt: now };
  const row = await prisma.signalConsentContinuation.update({
    where: { token: record.token },
    data: {
      state: next.state,
      updatedAt: new Date(now),
      tenantId: next.tenantId,
      subjectId: next.subjectId,
      consentCapturedAt: next.consentCapturedAt ? new Date(next.consentCapturedAt) : null,
      caseId: next.caseId,
      interactionId: next.interactionId,
      twinVersion: next.twinVersion,
      stateHash: next.stateHash,
    },
  });
  return toRecord(row);
}

export async function establishSignalIdentity(params: { token: string; tenantId: string; subjectId: string }, now = new Date().toISOString()): Promise<SignalContinuationRecord> {
  const record = await getSignalContinuation(params.token);
  if (!record) throw new Error("Continuation token not found");
  if (isSignalContinuationExpired(record, now)) return update(record, { state: "EXPIRED" }, now);
  if (record.subjectId && record.subjectId !== params.subjectId) throw new Error("Wrong identity for continuation token");
  if (record.tenantId && record.tenantId !== params.tenantId) throw new Error("Wrong tenant for continuation token");
  if (record.state !== "CONTINUE_REQUESTED") throw new Error("Continuation token already advanced");
  return update(record, { state: "IDENTITY_ESTABLISHED", tenantId: params.tenantId, subjectId: params.subjectId, stateHash: hashSignalContinuation({ ...record, tenantId: params.tenantId, subjectId: params.subjectId }) }, now);
}

export async function captureSignalConsent(params: { token: string; tenantId: string; subjectId: string; consent: boolean }, now = new Date().toISOString()): Promise<SignalContinuationRecord> {
  const record = await getSignalContinuation(params.token);
  if (!record) throw new Error("Continuation token not found");
  if (isSignalContinuationExpired(record, now)) return update(record, { state: "EXPIRED" }, now);
  if (record.tenantId !== params.tenantId || record.subjectId !== params.subjectId) throw new Error("Wrong identity or tenant for consent");
  if (record.state !== "IDENTITY_ESTABLISHED") throw new Error("Identity must be established before consent");
  if (!params.consent) throw new Error("Consent required before durable history");
  return update(record, { state: "CONSENT_CAPTURED", consentCapturedAt: now, stateHash: hashSignalContinuation({ ...record, consentCapturedAt: now }) }, now);
}

export async function bindSignalCase(params: { token: string; tenantId: string; subjectId: string; caseId: string }, now = new Date().toISOString()): Promise<SignalContinuationRecord> {
  const record = await getSignalContinuation(params.token);
  if (!record) throw new Error("Continuation token not found");
  if (record.tenantId !== params.tenantId || record.subjectId !== params.subjectId) throw new Error("Wrong identity or tenant for case binding");
  if (record.state !== "CONSENT_CAPTURED") throw new Error("Consent must be captured before case binding");
  return update(record, { state: "CASE_BOUND", caseId: params.caseId, stateHash: hashSignalContinuation({ ...record, caseId: params.caseId }) }, now);
}

export async function recordSignalInteraction(params: { token: string; tenantId: string; subjectId: string }, now = new Date().toISOString()): Promise<SignalContinuationRecord> {
  const record = await getSignalContinuation(params.token);
  if (!record) throw new Error("Continuation token not found");
  if (record.tenantId !== params.tenantId || record.subjectId !== params.subjectId) throw new Error("Wrong identity or tenant for interaction");
  if (record.state !== "CASE_BOUND") throw new Error("Case must be bound before recording interaction");
  return update(record, { state: "INTERACTION_RECORDED", interactionId: newSignalInteractionId(), stateHash: hashSignalContinuation({ ...record, interaction: now }) }, now);
}

export async function updateSignalTwin(params: { token: string; tenantId: string; subjectId: string }, now = new Date().toISOString()): Promise<SignalContinuationRecord> {
  const record = await getSignalContinuation(params.token);
  if (!record) throw new Error("Continuation token not found");
  if (record.tenantId !== params.tenantId || record.subjectId !== params.subjectId) throw new Error("Wrong identity or tenant for twin update");
  if (record.state !== "INTERACTION_RECORDED") throw new Error("Interaction must be recorded before twin update");
  return update(record, { state: "TWIN_UPDATED", twinVersion: (record.twinVersion ?? 0) + 1, stateHash: hashSignalContinuation({ ...record, twin: now }) }, now);
}

export async function hasDurableSignalHistory(tokenValue: string): Promise<boolean> {
  const record = await getSignalContinuation(tokenValue);
  return Boolean(record && ["CASE_BOUND", "INTERACTION_RECORDED", "TWIN_UPDATED"].includes(record.state));
}
