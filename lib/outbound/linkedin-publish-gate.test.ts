import { describe, expect, it } from "vitest";

import { canPublishLinkedInOutbound } from "./linkedin-publish-gate";
import type { LinkedInOutboundItem } from "./linkedin-outbound-governance";

const activeConnection = {
  connected: true,
  status: "active",
  scopes: ["openid", "profile", "w_member_social", "w_organization_social"],
  publishingEnabled: true,
  selectedPublishingTarget: {
    ownerType: "organization",
    ownerUrn: "urn:li:organization:115850136",
    ownerName: "Abraham of London",
    requiredScope: "w_organization_social",
    status: "ready",
  },
};

const linkedin6: LinkedInOutboundItem = {
  title: "Execution Problem vs Authority Problem",
  sequence: 6,
  channel: "linkedin",
  contentType: "post",
  status: "ready",
  draft: false,
  published: true,
  date: "2026-05-19",
  category: "Outbound",
  tier: "public",
  campaign: "decision-authority-infrastructure-launch",
  claimRisk: "LOW",
  body: "Not every execution problem is an execution problem.",
  filename: "06-execution-problem-vs-authority-problem.mdx",
};

describe("LinkedIn publish gate", () => {
  it("blocks draft posts", () => {
    const result = canPublishLinkedInOutbound(
      { ...linkedin6, draft: true, status: "draft", published: false },
      { connection: activeConnection },
    );

    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toContain("Draft");
  });

  it("blocks Q2/GMI post while report is DRAFT", () => {
    const result = canPublishLinkedInOutbound(
      {
        ...linkedin6,
        title: "A new market reality - why Q2 2026 matters",
        linkedReportId: "GMI-Q2-2026",
        requiresLifecycleCheck: true,
        publicationGate: "Publish only after GMI-Q2-2026 lifecycle is ACTIVE_UNTIL_SUPERSEDED",
        claimRisk: "MEDIUM",
        body: "Q2 intelligence work remains in preparation.",
      },
      { connection: activeConnection },
    );

    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toContain("GMI-Q2-2026");
  });

  it("allows LinkedIn #6 when connection is active", () => {
    const result = canPublishLinkedInOutbound(linkedin6, { connection: activeConnection });

    expect(result.allowed).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  it("blocks missing organization URN when default target is organization", () => {
    const result = canPublishLinkedInOutbound(linkedin6, {
      connection: {
        ...activeConnection,
        selectedPublishingTarget: {
          ...activeConnection.selectedPublishingTarget,
          ownerUrn: null,
          status: "organization_urn_missing",
        },
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toContain("LINKEDIN_ORG_TARGET_NOT_CONFIGURED");
  });

  it("blocks missing organization scope", () => {
    const result = canPublishLinkedInOutbound(linkedin6, {
      connection: {
        ...activeConnection,
        scopes: ["openid", "profile", "w_member_social"],
        selectedPublishingTarget: {
          ...activeConnection.selectedPublishingTarget,
          status: "required_scope_missing",
        },
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toContain("LINKEDIN_ORG_SCOPE_MISSING");
  });

  it("blocks member fallback without explicit confirmation", () => {
    const result = canPublishLinkedInOutbound(linkedin6, {
      connection: {
        ...activeConnection,
        selectedPublishingTarget: {
          ownerType: "member",
          ownerUrn: "urn:li:person:abc",
          ownerName: "Abraham Adaramola",
          requiredScope: "w_member_social",
          status: "ready",
        },
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toContain("LINKEDIN_MEMBER_FALLBACK_REQUIRES_CONFIRMATION");
  });

  it("blocks already posted item", () => {
    const result = canPublishLinkedInOutbound(
      { ...linkedin6, status: "posted", postedAt: "2026-05-20" },
      { connection: activeConnection },
    );

    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toContain("Already posted");
  });

  it("blocks disallowed phrases", () => {
    const result = canPublishLinkedInOutbound(
      { ...linkedin6, body: "AI predicts markets with guaranteed returns. This is investment advice." },
      { connection: activeConnection },
    );

    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toContain("AI predicts");
    expect(result.blockers.join(" ")).toContain("guaranteed");
    expect(result.blockers.join(" ")).toContain("investment advice");
  });

  it("blocks missing active connection", () => {
    const result = canPublishLinkedInOutbound(linkedin6, {
      connection: { connected: false, status: "revoked", scopes: [], publishingEnabled: true },
    });

    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toContain("connection is not active");
  });

  it("blocks frontmatter/control notes in final body", () => {
    const result = canPublishLinkedInOutbound(
      { ...linkedin6, body: "---\ntitle: Internal\n---\nrelease gate notes" },
      { connection: activeConnection },
    );

    expect(result.allowed).toBe(false);
    expect(result.blockers.join(" ")).toContain("frontmatter");
  });
});
