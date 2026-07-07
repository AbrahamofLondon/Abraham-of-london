/**
 * tests/demo-journey/funnel-event-store.test.ts
 *
 * §12/§23 — durable funnel store: events persist, the funnel aggregates, the biggest
 * drop-off is identified, and NO sensitive decision text can be persisted (the store
 * writes only allow-listed structured columns).
 */

import { describe, it, expect, beforeAll } from "vitest";
import Database from "better-sqlite3";
import { _setFunnelDbForTest, recordFunnelEvent, summarizeFunnel, isFunnelEvent } from "@/lib/demo/funnel-event-store";

beforeAll(() => { _setFunnelDbForTest(new Database(":memory:")); });

describe("§12 durable funnel event store", () => {
  it("persists events and aggregates the signal funnel", () => {
    for (let i = 0; i < 10; i++) recordFunnelEvent({ eventType: "SIGNAL_LANDING_VIEWED", sessionId: `s${i}`, sourceRoute: "/decision-instruments/signal" });
    for (let i = 0; i < 6; i++) recordFunnelEvent({ eventType: "SIGNAL_STARTED", sessionId: `s${i}`, sourceRoute: "/decision-instruments/signal" });
    for (let i = 0; i < 4; i++) recordFunnelEvent({ eventType: "SIGNAL_COMPLETED", sessionId: `s${i}`, sourceRoute: "/decision-instruments/signal" });
    const s = summarizeFunnel();
    expect(s.signal.views).toBe(10);
    expect(s.signal.starts).toBe(6);
    expect(s.signal.completions).toBe(4);
    expect(s.signal.completionRate).toBe(67); // 4/6
  });

  it("identifies the biggest drop-off in the ordered funnel", () => {
    const s = summarizeFunnel();
    // landing(10) → started(6) is the largest gap so far (lost 4)
    expect(s.biggestDropOff?.from).toBe("SIGNAL_LANDING_VIEWED");
    expect(s.biggestDropOff?.lost).toBe(4);
  });

  it("rejects unknown event types", () => {
    expect(isFunnelEvent("NONSENSE")).toBe(false);
    expect(() => recordFunnelEvent({ eventType: "NONSENSE" as never, sessionId: "x", sourceRoute: "/x" })).toThrow();
  });

  it("cannot persist sensitive decision text — only structured columns exist", () => {
    // a caller attaching decision content: the typed input has no such field, and the
    // insert writes only allow-listed columns. Force it through `as any` to prove it.
    const rec = recordFunnelEvent({ eventType: "SIGNAL_COMPLETED", sessionId: "leak", sourceRoute: "/x", decisionStatement: "confidential: we are firing the CFO" } as never);
    const raw = JSON.stringify(rec);
    expect(raw).not.toMatch(/confidential|firing the CFO/i);
  });
});
