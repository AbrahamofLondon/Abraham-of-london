import { describe, expect, it } from "vitest";

import { ADMIN_NAVIGATION } from "@/lib/admin/admin-navigation";
import { buildLinkedInOutboundAdminViewModel } from "@/pages/admin/outbound/linkedin";
import type { LinkedInConnectionStatus } from "@/lib/outbound/linkedin-oauth";
import type { ResolvedLinkedInOutbound } from "@/lib/outbound/linkedin-content-resolver";

const connection: LinkedInConnectionStatus = {
  connected: true,
  activeProfileKey: "community",
  ownerType: "organization",
  ownerUrn: "urn:li:organization:115850136",
  organisationId: "115850136",
  displayName: "Abraham",
  ownerName: "Abraham of London",
  scopes: ["openid", "profile", "w_member_social", "w_organization_social"],
  expiresAt: "2026-06-01T00:00:00.000Z",
  status: "active",
  publishingEnabled: true,
  selectedPublishingTarget: {
    profileKey: "community",
    ownerType: "organization",
    ownerUrn: "urn:li:organization:115850136",
    ownerName: "Abraham of London",
    requiredScope: "w_organization_social",
    isDefaultPublishingTarget: true,
    status: "ready",
  },
  memberConnection: {
    ownerUrn: "urn:li:person:abc",
    displayName: "Abraham Adaramola",
    status: "active",
  },
  profiles: {
    legacy: {
      profileKey: "legacy",
      configured: true,
      connected: true,
      status: "active",
      scopes: ["openid", "profile", "w_member_social"],
      missingRequiredScopes: [],
      intendedUse: "Legacy workflows.",
      memberConnection: {
        ownerUrn: "urn:li:person:abc",
        displayName: "Abraham Adaramola",
        status: "active",
      },
      organizationConnection: {
        ownerUrn: null,
        ownerName: null,
        status: "not_connected",
      },
    },
    community: {
      profileKey: "community",
      configured: true,
      connected: true,
      status: "active",
      scopes: ["openid", "profile", "email", "w_organization_social"],
      missingRequiredScopes: [],
      intendedUse: "Community Management workflows.",
      memberConnection: {
        ownerUrn: "urn:li:person:abc",
        displayName: "Abraham Adaramola",
        status: "active",
      },
      organizationConnection: {
        ownerUrn: "urn:li:organization:115850136",
        ownerName: "Abraham of London",
        status: "active",
      },
    },
  },
  message: "Connected.",
};

const linkedin6: ResolvedLinkedInOutbound = {
  slug: "06-execution-problem-vs-authority-problem",
  filename: "06-execution-problem-vs-authority-problem.mdx",
  title: "Execution Problem vs Authority Problem",
  body: "Not every execution problem is an execution problem.",
  charCount: 52,
  isPosted: false,
  item: {
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
    claimRisk: "LOW",
    body: "Not every execution problem is an execution problem.",
    filename: "06-execution-problem-vs-authority-problem.mdx",
  },
};

const q2Post: ResolvedLinkedInOutbound = {
  ...linkedin6,
  slug: "a-new-market-reality-why-Q2-2026-matters",
  title: "A new market reality - why Q2 2026 matters",
  item: {
    ...linkedin6.item,
    title: "A new market reality - why Q2 2026 matters",
    status: "draft",
    draft: true,
    published: false,
    linkedReportId: "GMI-Q2-2026",
    requiresLifecycleCheck: true,
    publicationGate: "Publish only after GMI-Q2-2026 lifecycle is ACTIVE_UNTIL_SUPERSEDED",
    claimRisk: "MEDIUM",
  },
};

describe("LinkedIn outbound admin console model", () => {
  it("shows connection status and LinkedIn #6 publishable", () => {
    const model = buildLinkedInOutboundAdminViewModel(connection, [q2Post, linkedin6]);
    const post = model.posts.find((item) => item.slug === linkedin6.slug);

    expect(model.connection.connected).toBe(true);
    expect(post?.publishable).toBe(true);
    expect(post?.readinessState).toBe("publishable");
  });

  it("shows Abraham of London Page as the publishing target", () => {
    const model = buildLinkedInOutboundAdminViewModel(connection, [linkedin6]);

    expect(model.connection.selectedPublishingTarget.ownerName).toBe("Abraham of London");
    expect(model.connection.selectedPublishingTarget.ownerType).toBe("organization");
    expect(model.connection.selectedPublishingTarget.requiredScope).toBe("w_organization_social");
  });

  it("shows Q2 blocked while linked report is draft", () => {
    const model = buildLinkedInOutboundAdminViewModel(connection, [q2Post, linkedin6]);
    const post = model.posts.find((item) => item.slug === q2Post.slug);

    expect(post?.publishable).toBe(false);
    expect(post?.readinessState).toBe("draft");
    expect(post?.blockers.join(" ")).toContain("GMI-Q2-2026");
  });

  it("does not render token-shaped values in the model", () => {
    const model = buildLinkedInOutboundAdminViewModel(connection, [linkedin6]);

    expect(model.tokenLeakProbe).not.toMatch(/access_token|refresh_token|Bearer|encrypted/i);
  });

  it("admin navigation contains LinkedIn publishing link", () => {
    const items = ADMIN_NAVIGATION.flatMap((section) => section.items);
    expect(items.some((item) => item.href === "/admin/outbound/linkedin")).toBe(true);
  });
});
