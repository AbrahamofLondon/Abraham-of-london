export type { SignalContinuationRecord, SignalContinuationState } from "./signal-consent-transition-store.shared";

function isProd(): boolean { return process.env.NODE_ENV === "production"; }
async function adapter() { return isProd() ? import("./signal-consent-transition-store.prisma") : import("./signal-consent-transition-store"); }

export async function requestSignalContinuation(input: { recommendationId: string; sessionId: string; mode: "LIVE" | "EXAMPLE"; ttlMinutes?: number }, now = new Date().toISOString()) {
  return (await adapter()).requestSignalContinuation(input, now);
}
export async function getSignalContinuation(token: string) { return (await adapter()).getSignalContinuation(token); }
export async function establishSignalIdentity(params: { token: string; tenantId: string; subjectId: string }, now = new Date().toISOString()) { return (await adapter()).establishSignalIdentity(params, now); }
export async function captureSignalConsent(params: { token: string; tenantId: string; subjectId: string; consent: boolean }, now = new Date().toISOString()) { return (await adapter()).captureSignalConsent(params, now); }
export async function bindSignalCase(params: { token: string; tenantId: string; subjectId: string; caseId: string }, now = new Date().toISOString()) { return (await adapter()).bindSignalCase(params, now); }
export async function recordSignalInteraction(params: { token: string; tenantId: string; subjectId: string }, now = new Date().toISOString()) { return (await adapter()).recordSignalInteraction(params, now); }
export async function updateSignalTwin(params: { token: string; tenantId: string; subjectId: string }, now = new Date().toISOString()) { return (await adapter()).updateSignalTwin(params, now); }
export async function hasDurableSignalHistory(token: string) { return (await adapter()).hasDurableSignalHistory(token); }
