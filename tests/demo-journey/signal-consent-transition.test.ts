import { beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import {
  _setSignalContinuationDbForTest,
  bindSignalCase,
  captureSignalConsent,
  establishSignalIdentity,
  getSignalContinuation,
  hasDurableSignalHistory,
  recordSignalInteraction,
  requestSignalContinuation,
  updateSignalTwin,
} from "@/lib/demo/signal-consent-transition-store";

beforeEach(() => { _setSignalContinuationDbForTest(new Database(":memory:")); });

describe("Signal consent-gated continuation", () => {
  it("keeps anonymous Signal non-persistent until consent and case binding", () => {
    const requested = requestSignalContinuation({ recommendationId: "rec_abc12345", sessionId: "session-a", mode: "LIVE" }, "2026-07-07T10:00:00.000Z");
    expect(requested.state).toBe("CONTINUE_REQUESTED");
    expect(hasDurableSignalHistory(requested.token)).toBe(false);

    establishSignalIdentity({ token: requested.token, tenantId: "tenant-a", subjectId: "user-a" }, "2026-07-07T10:01:00.000Z");
    expect(hasDurableSignalHistory(requested.token)).toBe(false);
    captureSignalConsent({ token: requested.token, tenantId: "tenant-a", subjectId: "user-a", consent: true }, "2026-07-07T10:02:00.000Z");
    expect(hasDurableSignalHistory(requested.token)).toBe(false);

    const bound = bindSignalCase({ token: requested.token, tenantId: "tenant-a", subjectId: "user-a", caseId: "case-a" }, "2026-07-07T10:03:00.000Z");
    expect(bound.state).toBe("CASE_BOUND");
    expect(hasDurableSignalHistory(requested.token)).toBe(true);
  });

  it("rejects sample/example readings as customer history", () => {
    expect(() => requestSignalContinuation({ recommendationId: "rec_abc12345", sessionId: "session-a", mode: "EXAMPLE" })).toThrow(/Example/);
  });

  it("requires consent before durable case binding", () => {
    const rec = requestSignalContinuation({ recommendationId: "rec_abc12345", sessionId: "session-a", mode: "LIVE" });
    establishSignalIdentity({ token: rec.token, tenantId: "tenant-a", subjectId: "user-a" });
    expect(() => bindSignalCase({ token: rec.token, tenantId: "tenant-a", subjectId: "user-a", caseId: "case-a" })).toThrow(/Consent/);
    expect(() => captureSignalConsent({ token: rec.token, tenantId: "tenant-a", subjectId: "user-a", consent: false })).toThrow(/Consent required/);
  });

  it("denies wrong identity and wrong tenant transitions", () => {
    const rec = requestSignalContinuation({ recommendationId: "rec_abc12345", sessionId: "session-a", mode: "LIVE" });
    establishSignalIdentity({ token: rec.token, tenantId: "tenant-a", subjectId: "user-a" });
    expect(() => captureSignalConsent({ token: rec.token, tenantId: "tenant-b", subjectId: "user-a", consent: true })).toThrow(/Wrong identity or tenant/);
    expect(() => captureSignalConsent({ token: rec.token, tenantId: "tenant-a", subjectId: "user-b", consent: true })).toThrow(/Wrong identity or tenant/);
  });

  it("is replay safe once a token advances", () => {
    const rec = requestSignalContinuation({ recommendationId: "rec_abc12345", sessionId: "session-a", mode: "LIVE" });
    establishSignalIdentity({ token: rec.token, tenantId: "tenant-a", subjectId: "user-a" });
    expect(() => establishSignalIdentity({ token: rec.token, tenantId: "tenant-a", subjectId: "user-a" })).toThrow(/already advanced/);
  });

  it("expires continuation tokens", () => {
    const rec = requestSignalContinuation({ recommendationId: "rec_abc12345", sessionId: "session-a", mode: "LIVE", ttlMinutes: 1 }, "2026-07-07T10:00:00.000Z");
    const expired = establishSignalIdentity({ token: rec.token, tenantId: "tenant-a", subjectId: "user-a" }, "2026-07-07T10:02:00.000Z");
    expect(expired.state).toBe("EXPIRED");
  });

  it("records interaction before twin update and increments durable twin version", () => {
    const rec = requestSignalContinuation({ recommendationId: "rec_abc12345", sessionId: "session-a", mode: "LIVE" });
    establishSignalIdentity({ token: rec.token, tenantId: "tenant-a", subjectId: "user-a" });
    captureSignalConsent({ token: rec.token, tenantId: "tenant-a", subjectId: "user-a", consent: true });
    bindSignalCase({ token: rec.token, tenantId: "tenant-a", subjectId: "user-a", caseId: "case-a" });
    const interaction = recordSignalInteraction({ token: rec.token, tenantId: "tenant-a", subjectId: "user-a" });
    expect(interaction.interactionId).toMatch(/^int_/);
    const twin = updateSignalTwin({ token: rec.token, tenantId: "tenant-a", subjectId: "user-a" });
    expect(twin.state).toBe("TWIN_UPDATED");
    expect(twin.twinVersion).toBe(1);
    expect(getSignalContinuation(rec.token)?.caseId).toBe("case-a");
  });
});
