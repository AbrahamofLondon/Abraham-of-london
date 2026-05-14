import { describe, it, expect } from "vitest";
import {
  normaliseSeverity,
  normaliseStatus,
  buildEventMessage,
  countBySources,
  type AdminEvent,
  type AdminEventSource,
} from "./event-log";

describe("normaliseSeverity", () => {
  it("passes through valid lowercase severities", () => {
    expect(normaliseSeverity("debug")).toBe("debug");
    expect(normaliseSeverity("info")).toBe("info");
    expect(normaliseSeverity("warn")).toBe("warn");
    expect(normaliseSeverity("error")).toBe("error");
    expect(normaliseSeverity("critical")).toBe("critical");
  });

  it("lowercases the input", () => {
    expect(normaliseSeverity("CRITICAL")).toBe("critical");
    expect(normaliseSeverity("ERROR")).toBe("error");
    expect(normaliseSeverity("WARN")).toBe("warn");
  });

  it("returns info for null", () => {
    expect(normaliseSeverity(null)).toBe("info");
  });

  it("returns info for undefined", () => {
    expect(normaliseSeverity(undefined)).toBe("info");
  });

  it("returns info for unrecognised values", () => {
    expect(normaliseSeverity("high")).toBe("info");
    expect(normaliseSeverity("medium")).toBe("info");
    expect(normaliseSeverity("")).toBe("info");
  });
});

describe("normaliseStatus", () => {
  it("maps boolean true to success", () => {
    expect(normaliseStatus(true)).toBe("success");
  });

  it("maps boolean false to failure", () => {
    expect(normaliseStatus(false)).toBe("failure");
  });

  it("maps string 'success' to success", () => {
    expect(normaliseStatus("success")).toBe("success");
  });

  it("maps string 'failure' to failure", () => {
    expect(normaliseStatus("failure")).toBe("failure");
  });

  it("maps string 'error' to failure", () => {
    expect(normaliseStatus("error")).toBe("failure");
  });

  it("maps string 'pending' to pending", () => {
    expect(normaliseStatus("pending")).toBe("pending");
  });

  it("maps null to unknown", () => {
    expect(normaliseStatus(null)).toBe("unknown");
  });

  it("maps undefined to unknown", () => {
    expect(normaliseStatus(undefined)).toBe("unknown");
  });

  it("maps unrecognised string to unknown", () => {
    expect(normaliseStatus("something_else")).toBe("unknown");
  });
});

describe("buildEventMessage", () => {
  it("returns just the event type when no resource or actor", () => {
    expect(buildEventMessage("AUTH_SIGNIN", null, null)).toBe("AUTH_SIGNIN");
  });

  it("includes resource name when provided", () => {
    expect(buildEventMessage("ASSET_DOWNLOAD", "report.pdf", null)).toBe(
      "ASSET_DOWNLOAD on report.pdf",
    );
  });

  it("includes actor email when provided", () => {
    expect(buildEventMessage("AUTH_SIGNIN", null, "admin@example.com")).toBe(
      "AUTH_SIGNIN by admin@example.com",
    );
  });

  it("includes both resource and actor", () => {
    const msg = buildEventMessage("ASSET_DOWNLOAD", "report.pdf", "user@example.com");
    expect(msg).toBe("ASSET_DOWNLOAD on report.pdf by user@example.com");
  });

  it("handles empty string resource as falsy", () => {
    expect(buildEventMessage("EVENT", "", null)).toBe("EVENT");
  });
});

describe("countBySources", () => {
  function makeEvent(source: AdminEventSource): AdminEvent {
    return {
      id: `${source}_1`,
      source,
      eventType: "TEST",
      category: null,
      severity: "info",
      status: "success",
      actorEmail: null,
      actorType: null,
      resourceType: null,
      resourceName: null,
      message: "test",
      createdAt: new Date().toISOString(),
      adminHref: null,
    };
  }

  it("returns zero counts for all sources when events is empty", () => {
    const counts = countBySources([]);
    expect(counts.system_audit).toBe(0);
    expect(counts.governance).toBe(0);
    expect(counts.access_audit).toBe(0);
    expect(counts.download).toBe(0);
    expect(counts.webhook).toBe(0);
  });

  it("counts events by source correctly", () => {
    const events = [
      makeEvent("system_audit"),
      makeEvent("system_audit"),
      makeEvent("governance"),
      makeEvent("download"),
    ];
    const counts = countBySources(events);
    expect(counts.system_audit).toBe(2);
    expect(counts.governance).toBe(1);
    expect(counts.download).toBe(1);
    expect(counts.access_audit).toBe(0);
  });

  it("counts all five source types", () => {
    const events: AdminEvent[] = [
      "system_audit",
      "governance",
      "access_audit",
      "download",
      "webhook",
    ].map((s) => makeEvent(s as AdminEventSource));
    const counts = countBySources(events);
    for (const source of Object.values(counts)) {
      expect(source).toBe(1);
    }
  });
});
