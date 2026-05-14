import { describe, it, expect } from "vitest";
import {
  toneForSeverity,
  toneForStatus,
  normaliseAdminStatusLabel,
} from "./AdminStatusBadge";

describe("toneForSeverity", () => {
  it("maps CRITICAL to critical", () => {
    expect(toneForSeverity("CRITICAL")).toBe("critical");
  });

  it("maps HIGH to danger", () => {
    expect(toneForSeverity("HIGH")).toBe("danger");
  });

  it("maps MEDIUM to warning", () => {
    expect(toneForSeverity("MEDIUM")).toBe("warning");
  });

  it("maps LOW to muted", () => {
    expect(toneForSeverity("LOW")).toBe("muted");
  });

  it("maps unknown value to neutral", () => {
    expect(toneForSeverity("UNKNOWN_SEVERITY")).toBe("neutral");
  });

  it("is case-insensitive", () => {
    expect(toneForSeverity("critical")).toBe("critical");
    expect(toneForSeverity("high")).toBe("danger");
  });
});

describe("toneForStatus", () => {
  it("maps PASS to success", () => {
    expect(toneForStatus("PASS")).toBe("success");
  });

  it("maps FAIL to danger", () => {
    expect(toneForStatus("FAIL")).toBe("danger");
  });

  it("maps WATCH to warning", () => {
    expect(toneForStatus("WATCH")).toBe("warning");
  });

  it("maps OVERDUE to critical", () => {
    expect(toneForStatus("OVERDUE")).toBe("critical");
  });

  it("maps ESCALATED to critical", () => {
    expect(toneForStatus("ESCALATED")).toBe("critical");
  });

  it("maps UPCOMING to info", () => {
    expect(toneForStatus("UPCOMING")).toBe("info");
  });

  it("maps UNAVAILABLE to muted", () => {
    expect(toneForStatus("UNAVAILABLE")).toBe("muted");
  });

  it("maps COMPLETED to success", () => {
    expect(toneForStatus("COMPLETED")).toBe("success");
  });

  it("maps SKIPPED to warning", () => {
    expect(toneForStatus("SKIPPED")).toBe("warning");
  });

  it("maps LIVE to success", () => {
    expect(toneForStatus("LIVE")).toBe("success");
  });

  it("maps ROUGH to warning", () => {
    expect(toneForStatus("ROUGH")).toBe("warning");
  });

  it("maps DEPRECATED to muted", () => {
    expect(toneForStatus("DEPRECATED")).toBe("muted");
  });

  it("maps REVIEW_IN_PROGRESS to warning", () => {
    expect(toneForStatus("REVIEW_IN_PROGRESS")).toBe("warning");
  });

  it("is case-insensitive", () => {
    expect(toneForStatus("pass")).toBe("success");
    expect(toneForStatus("overdue")).toBe("critical");
  });

  it("handles hyphen-separated values", () => {
    expect(toneForStatus("review-in-progress")).toBe("warning");
  });

  it("maps unknown status to neutral", () => {
    expect(toneForStatus("SOME_FUTURE_STATE")).toBe("neutral");
  });
});

describe("normaliseAdminStatusLabel", () => {
  it("converts underscore-separated uppercase to title case", () => {
    expect(normaliseAdminStatusLabel("NOT_CONFIGURED")).toBe("Not Configured");
  });

  it("converts REVIEW_IN_PROGRESS", () => {
    expect(normaliseAdminStatusLabel("REVIEW_IN_PROGRESS")).toBe("Review In Progress");
  });

  it("converts single-word labels", () => {
    expect(normaliseAdminStatusLabel("OVERDUE")).toBe("Overdue");
  });

  it("passes through already-capitalised values cleanly", () => {
    expect(normaliseAdminStatusLabel("PASS")).toBe("Pass");
  });

  it("handles lowercase input", () => {
    expect(normaliseAdminStatusLabel("completed")).toBe("Completed");
  });
});
