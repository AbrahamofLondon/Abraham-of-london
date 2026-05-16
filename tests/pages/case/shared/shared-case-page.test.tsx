import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadSharedCaseByToken: vi.fn(),
}));

vi.mock("@/lib/product/case-sharing", () => ({
  loadSharedCaseByToken: mocks.loadSharedCaseByToken,
}));

vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import SharedCasePage, { getServerSideProps } from "@/pages/case/shared/[token]";

const activeResult = {
  state: "ACTIVE" as const,
  share: {
    id: "share_001",
    caseId: "case_001",
    ownerEmail: "owner@example.com",
    recipientEmail: null,
    role: "AUDITOR" as const,
    status: "ACTIVE" as const,
    tokenHash: "hashed",
    allowExport: false,
    expiresAt: "2026-05-23T12:00:00.000Z",
    createdAt: "2026-05-16T12:00:00.000Z",
    revokedAt: null,
  },
  view: {
    caseId: "case_001",
    caseRef: "case_001",
    title: "Approve the operating model change",
    status: "ACTIVE",
    summary: "Authority remains unclear.",
    evidencePosture: "SINGLE_SOURCE",
    governanceImplication: "Unresolved contradictions are accumulating.",
    nextAction: "Resolve contradiction: Authority remains unclear.",
    provenanceStatus: "AVAILABLE" as const,
    canVerify: true,
    canExport: false,
  },
  sensitive: {
    rawEvidence: "RAW_EVIDENCE_SECRET",
    suppressionDetail: "SUPPRESSION_DETAIL_SECRET",
    actorId: "actor_private_123",
    internalNote: "INTERNAL_NOTE_SECRET",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("shared case page", () => {
  it("renders a valid shared case using only client-safe fields", async () => {
    mocks.loadSharedCaseByToken.mockResolvedValueOnce(activeResult);
    const response = await getServerSideProps({
      params: { token: "case_token" },
    } as never);
    const props = "props" in response ? response.props : null;
    const html = renderToStaticMarkup(<SharedCasePage {...(props as any)} />);

    expect(html).toContain("Approve the operating model change");
    expect(html).toContain("Authority remains unclear.");
    expect(html).not.toContain(activeResult.sensitive.rawEvidence);
    expect(html).not.toContain(activeResult.sensitive.suppressionDetail);
    expect(html).not.toContain(activeResult.sensitive.actorId);
    expect(html).not.toContain(activeResult.sensitive.internalNote);
    expect(html).not.toContain("owner@example.com");
    expect(html).not.toContain("hashed");
  });

  it("renders expired and revoked links as unavailable", () => {
    const expired = renderToStaticMarkup(<SharedCasePage token="expired" state="EXPIRED" share={null} view={null} />);
    const revoked = renderToStaticMarkup(<SharedCasePage token="revoked" state="REVOKED" share={null} view={null} />);

    expect(expired).toContain("This shared case link has expired.");
    expect(revoked).toContain("This shared case link has been revoked by the owner.");
  });

  it("keeps viewer exports disabled when export is not allowed", () => {
    const html = renderToStaticMarkup(
      <SharedCasePage
        token="viewer"
        state="ACTIVE"
        share={{
          id: activeResult.share.id,
          caseId: activeResult.share.caseId,
          recipientEmail: activeResult.share.recipientEmail,
          role: "VIEWER",
          status: activeResult.share.status,
          allowExport: false,
          expiresAt: activeResult.share.expiresAt,
          createdAt: activeResult.share.createdAt,
          revokedAt: activeResult.share.revokedAt,
        }}
        view={{ ...activeResult.view, canVerify: false, canExport: false }}
      />,
    );

    expect(html).not.toContain("Export client-safe evidence");
  });
});
