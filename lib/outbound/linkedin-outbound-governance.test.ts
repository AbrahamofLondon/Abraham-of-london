import { describe, expect, it } from "vitest";

import {
  getDraftLinkedInPosts,
  getPublishableLinkedInPosts,
  validateLinkedInClaimSafety,
  validateLinkedInOutboundItem,
  validateLinkedInOutboundMetadata,
  validateLinkedInPublicationGate,
  validateLinkedInSequence,
  type LinkedInOutboundItem,
} from "./linkedin-outbound-governance";

const baseItem: LinkedInOutboundItem = {
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
  body: "Before demanding execution, confirm that the decision has actually been authorised.",
  filename: "06-execution-problem-vs-authority-problem.mdx",
};

describe("LinkedIn outbound governance", () => {
  it("fails when draft true also has published true", () => {
    const result = validateLinkedInOutboundMetadata({ ...baseItem, draft: true, published: true });

    expect(result.errors).toContain("draft true cannot have published true.");
  });

  it("blocks the Q2 article while GMI-Q2-2026 lifecycle is DRAFT", () => {
    const result = validateLinkedInPublicationGate({
      ...baseItem,
      title: "A new market reality - why Q2 2026 matters",
      status: "ready",
      draft: false,
      published: true,
      linkedReportId: "GMI-Q2-2026",
      requiresLifecycleCheck: true,
      publicationGate: "Publish only after GMI-Q2-2026 lifecycle is active.",
    });

    expect(result.errors.join(" ")).toContain("GMI-Q2-2026 is DRAFT");
  });

  it("allows LinkedIn #6 readiness", () => {
    const result = validateLinkedInOutboundItem(baseItem);

    expect(result.errors).toEqual([]);
    expect(result.ready).toBe(true);
  });

  it("fails duplicate sequence numbers within the same campaign", () => {
    const result = validateLinkedInSequence([
      baseItem,
      { ...baseItem, title: "Duplicate", filename: "06-duplicate.mdx" },
    ]);

    expect(result.errors[0]).toContain("Duplicate LinkedIn sequence 6");
  });

  it("warns when a sequence filename is missing a sequence field", () => {
    const result = validateLinkedInSequence([
      { ...baseItem, sequence: null, filename: "07-missing-sequence.mdx" },
    ]);

    expect(result.warnings[0]).toContain("sequence-style filename");
  });

  it("fails claim safety for AI predicts markets", () => {
    const result = validateLinkedInClaimSafety({
      ...baseItem,
      body: "Our AI predicts markets for operators.",
    });

    expect(result.errors[0]).toContain("AI predicts markets");
  });

  it("fails Q2 availability claims while linked report is draft", () => {
    const result = validateLinkedInPublicationGate({
      ...baseItem,
      status: "draft",
      draft: true,
      published: false,
      linkedReportId: "GMI-Q2-2026",
      requiresLifecycleCheck: true,
      publicationGate: "Publish only after GMI-Q2-2026 lifecycle is active.",
      body: "The Q2 report is now available.",
    });

    expect(result.errors).toContain("Q2 report availability claim is not allowed while linked report lifecycle is draft.");
  });

  it("warns when posted content lacks postedAt and linkedinUrl", () => {
    const result = validateLinkedInOutboundMetadata({
      ...baseItem,
      status: "posted",
      postedAt: null,
      linkedinUrl: null,
    });

    expect(result.warnings[0]).toContain("status posted should include postedAt or linkedinUrl");
  });

  it("excludes drafts from publishable posts", () => {
    const draft = { ...baseItem, status: "draft", draft: true, published: false };

    expect(getPublishableLinkedInPosts([baseItem, draft])).toEqual([baseItem]);
  });

  it("includes draft GMI article in draft posts", () => {
    const q2Draft = {
      ...baseItem,
      title: "A new market reality - why Q2 2026 matters",
      status: "draft",
      draft: true,
      published: false,
      linkedReportId: "GMI-Q2-2026",
    };

    expect(getDraftLinkedInPosts([baseItem, q2Draft])).toContain(q2Draft);
  });
});
