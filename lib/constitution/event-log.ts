import crypto from "crypto";
import { saveConstitutionalEvent } from "./observability-store";
import type {
  ConstitutionalEvent,
  ConstitutionalEventType,
  ConstitutionalSeverity,
} from "./observability-types";

export function logConstitutionalEvent(input: {
  caseKey?: string;
  operatorKey?: string;
  type: ConstitutionalEventType;
  severity?: ConstitutionalSeverity;
  title: string;
  detail: string;
  metadata?: Record<string, unknown>;
}): ConstitutionalEvent {
  const event: ConstitutionalEvent = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    caseKey: input.caseKey,
    operatorKey: input.operatorKey,
    type: input.type,
    severity: input.severity ?? "INFO",
    title: input.title,
    detail: input.detail,
    metadata: input.metadata,
  };

  return saveConstitutionalEvent(event);
}