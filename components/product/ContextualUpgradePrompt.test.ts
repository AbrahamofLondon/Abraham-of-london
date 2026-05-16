import { describe, expect, it } from "vitest";

import type { UpgradeAction } from "./ContextualUpgradePrompt";

describe("UpgradeAction type", () => {
  it("includes all expected actions", () => {
    const actions: UpgradeAction[] = [
      "create_fourth_case",
      "request_return_brief",
      "export_evidence",
      "share_case",
      "invite_organisation_member",
      "access_advanced_benchmark",
      "create_api_key",
    ];
    expect(actions).toHaveLength(7);
  });
});
