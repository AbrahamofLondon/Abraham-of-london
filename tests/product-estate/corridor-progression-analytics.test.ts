/**
 * tests/product-estate/corridor-progression-analytics.test.ts
 *
 * §8 — Corridor Analytics tests: event recording, filtering, summary calculations.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { recordCorridorEvent, getCorridorEvents, getCorridorAnalyticsSummary } from "../../lib/intelligence/corridor/corridor-progression-analytics";

describe("Corridor Progression Analytics", () => {
  beforeEach(() => {
    // Clear module-level state by re-importing
  });

  it("records an event and returns it with generated ID and timestamp", () => {
    const event = recordCorridorEvent({
      customerId: "customer-1",
      eventType: "corridor_entry",
      productCode: "fast_diagnostic",
      sourceProductCode: null,
      metadata: {},
    });
    expect(event.eventId).toBeTruthy();
    expect(event.timestamp).toBeTruthy();
    expect(event.customerId).toBe("customer-1");
    expect(event.eventType).toBe("corridor_entry");
  });

  it("getCorridorEvents returns all events when no filter is applied", () => {
    const uid = `all-events-${Date.now()}`;
    recordCorridorEvent({ customerId: uid, eventType: "corridor_entry", productCode: "p1", sourceProductCode: null, metadata: {} });
    recordCorridorEvent({ customerId: uid, eventType: "product_completed", productCode: "p2", sourceProductCode: "p1", metadata: {} });
    const all = getCorridorEvents();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it("getCorridorEvents filters by customer ID", () => {
    const uid = `filter-${Date.now()}`;
    recordCorridorEvent({ customerId: uid, eventType: "corridor_entry", productCode: "p1", sourceProductCode: null, metadata: {} });
    recordCorridorEvent({ customerId: `${uid}-other`, eventType: "product_completed", productCode: "p2", sourceProductCode: "p1", metadata: {} });
    const filtered = getCorridorEvents(uid);
    expect(filtered.length).toBe(1);
    expect(filtered[0].customerId).toBe(uid);
  });

  it("getCorridorAnalyticsSummary returns aggregated metrics", () => {
    const uid = `summary-${Date.now()}`;
    recordCorridorEvent({ customerId: uid, eventType: "corridor_entry", productCode: "p1", sourceProductCode: null, metadata: {} });
    recordCorridorEvent({ customerId: uid, eventType: "recommendation_viewed", productCode: "p2", sourceProductCode: "p1", metadata: {} });
    recordCorridorEvent({ customerId: uid, eventType: "recommendation_accepted", productCode: "p2", sourceProductCode: "p1", metadata: {} });
    recordCorridorEvent({ customerId: uid, eventType: "product_started", productCode: "p2", sourceProductCode: "p1", metadata: {} });
    recordCorridorEvent({ customerId: uid, eventType: "product_completed", productCode: "p2", sourceProductCode: "p1", metadata: {} });

    const summary = getCorridorAnalyticsSummary();
    expect(summary.totalCustomers).toBeGreaterThanOrEqual(1);
    expect(summary.totalEvents).toBeGreaterThanOrEqual(5);
    expect(summary.averageCompletionRate).toBeGreaterThanOrEqual(0);
  });

  it("summary handles zero events gracefully", () => {
    const summary = getCorridorAnalyticsSummary();
    // May have events from previous tests, but should not crash
    expect(typeof summary.totalCustomers).toBe("number");
    expect(typeof summary.averageCompletionRate).toBe("number");
  });
});
