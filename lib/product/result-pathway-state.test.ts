import { describe, expect, it } from "vitest";

import { deriveResultPathwayState } from "./result-pathway-state";

const baseInput = {
  surface: "fast_diagnostic" as const,
  persistence: "session_only" as const,
  userState: "anonymous" as const,
  evidenceState: "basic" as const,
};

describe("deriveResultPathwayState", () => {
  it("routes anonymous unsaved results to case saving", () => {
    const state = deriveResultPathwayState(baseInput);
    expect(state.primaryAction.actionType).toBe("save_case");
    expect(state.primaryAction.label).toContain("Create free account");
  });

  it("routes authenticated unsaved results to Decision Centre saving", () => {
    const state = deriveResultPathwayState({
      ...baseInput,
      userState: "authenticated_free",
    });
    expect(state.primaryAction.actionType).toBe("save_case");
    expect(state.primaryAction.label).toBe("Save this case to Decision Centre");
  });

  it("routes saved cases to the case detail view", () => {
    const state = deriveResultPathwayState({
      ...baseInput,
      persistence: "saved_case",
      userState: "professional",
      caseId: "CASE-2605-A3F2",
    });
    expect(state.primaryAction.actionType).toBe("open_decision_centre");
    expect(state.primaryAction.href).toBe("/decision-centre/case/CASE-2605-A3F2");
  });

  it("keeps board summary visibly preview-only", () => {
    const state = deriveResultPathwayState({
      ...baseInput,
      surface: "board_summary",
    });
    expect(state.boundaryNote).toContain("board-ready preview");
    expect(state.boundaryNote).toContain("does not create a new governed record");
  });

  it("keeps decision delay explicitly non-governed until saved", () => {
    const state = deriveResultPathwayState({
      ...baseInput,
      surface: "decision_delay",
    });
    expect(state.boundaryNote).toContain("No governed record exists");
  });

  it("shows Executive Reporting as secondary when evidence is strong", () => {
    const state = deriveResultPathwayState({
      ...baseInput,
      evidenceState: "strong",
      earnedRoute: {
        route: "EXECUTIVE_REPORTING",
        label: "Request Executive Reporting",
        href: "/diagnostics/executive-reporting",
        reason: "Board-grade interpretation is warranted.",
      },
    });
    expect(state.commercialState).toBe("paid_report_eligible");
    expect(state.primaryAction.actionType).toBe("save_case");
    expect(state.secondaryActions.some((action) => action.actionType === "generate_report")).toBe(true);
  });

  it("shows Strategy Room only as earned intervention when intervention ready", () => {
    const state = deriveResultPathwayState({
      ...baseInput,
      evidenceState: "intervention_ready",
      earnedRoute: {
        route: "STRATEGY_ROOM",
        label: "Enter Strategy Room",
        href: "/strategy-room",
        reason: "Intervention is warranted.",
      },
    });
    expect(state.commercialState).toBe("strategy_room_eligible");
    expect(state.secondaryActions.find((action) => action.actionType === "enter_strategy_room")?.reason).toContain("Earned intervention layer");
  });

  it("recommends Professional continuity when the free limit is reached", () => {
    const state = deriveResultPathwayState({
      ...baseInput,
      userState: "authenticated_free",
      freeActiveCaseLimitReached: true,
    });
    expect(state.commercialState).toBe("professional_required");
    expect(state.primaryAction.actionType).toBe("start_trial");
  });

  it("does not show a free-limit prompt for Professional users", () => {
    const state = deriveResultPathwayState({
      ...baseInput,
      userState: "professional",
      freeActiveCaseLimitReached: true,
    });
    expect(state.commercialState).not.toBe("professional_required");
    expect(state.primaryAction.actionType).toBe("save_case");
  });

  it("never returns more than two secondary CTAs", () => {
    const state = deriveResultPathwayState({
      ...baseInput,
      surface: "decision_delay",
      evidenceState: "strong",
      earnedRoute: {
        route: "EXECUTIVE_REPORTING",
        label: "Request Executive Reporting",
        href: "/diagnostics/executive-reporting",
        reason: "Board-grade interpretation is warranted.",
      },
    });
    expect(state.secondaryActions.length).toBeLessThanOrEqual(2);
  });
});
