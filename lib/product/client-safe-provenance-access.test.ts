/**
 * Tests for client-safe provenance access control.
 *
 * Covers:
 * - Unsupported subject types return honest unavailable
 * - Subject not found returns 404
 * - Admin bypasses organisation/retainer checks
 * - Non-admin with matching email gets access
 * - Non-admin without matching email gets 403
 * - Missing viewer email returns 403 for protected subjects
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    organisationMembership: {
      findFirst: vi.fn(),
    },
    retainerContract: {
      findUnique: vi.fn(),
    },
    // Index signature for dynamic properties like executiveReportingRun
    // accessed via (prisma as any).executiveReportingRun in the source module
  } as Record<string, unknown> & {
    organisationMembership: { findFirst: ReturnType<typeof vi.fn> };
    retainerContract: { findUnique: ReturnType<typeof vi.fn> };
  },
  loadOversightCycleArchive: vi.fn(),
  listAllDeliveries: vi.fn(),
  verifyRetainerAccess: vi.fn(),
  isSupportedDecisionProvenanceSubjectType: vi.fn(),
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/lib/admin/decision-provenance-record", () => ({
  isSupportedDecisionProvenanceSubjectType:
    mocks.isSupportedDecisionProvenanceSubjectType,
}));

vi.mock("@/lib/product/oversight-cycle-archive", () => ({
  loadOversightCycleArchive: mocks.loadOversightCycleArchive,
}));

vi.mock("@/lib/product/oversight-delivery-service", () => ({
  listAllDeliveries: mocks.listAllDeliveries,
}));

vi.mock("@/lib/retainers/retainer-service", () => ({
  verifyRetainerAccess: mocks.verifyRetainerAccess,
}));

import { authorizeClientSafeProvenanceSubject } from "./client-safe-provenance-access";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isSupportedDecisionProvenanceSubjectType.mockImplementation(
    (type: string) => ["OVERSIGHT_CYCLE", "EXECUTIVE_REPORT", "RETAINER_ACCOUNT", "DELIVERY_ITEM"].includes(type),
  );
});

describe("authorizeClientSafeProvenanceSubject", () => {
  describe("unsupported subject types", () => {
    it("returns UNSUPPORTED_SUBJECT_TYPE for DECISION_CASE", async () => {
      mocks.isSupportedDecisionProvenanceSubjectType.mockReturnValueOnce(false);

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "DECISION_CASE",
        subjectId: "case_001",
        viewerEmail: "admin@example.com",
        viewerIsAdmin: true,
      });

      expect(result).toEqual({
        ok: false,
        status: 422,
        reason: "UNSUPPORTED_SUBJECT_TYPE",
      });
    });

    it("returns UNSUPPORTED_SUBJECT_TYPE for unknown subject types", async () => {
      mocks.isSupportedDecisionProvenanceSubjectType.mockReturnValueOnce(false);

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "STRATEGY_ROOM_SESSION",
        subjectId: "session_001",
        viewerEmail: "admin@example.com",
        viewerIsAdmin: true,
      });

      expect(result).toEqual({
        ok: false,
        status: 422,
        reason: "UNSUPPORTED_SUBJECT_TYPE",
      });
    });
  });

  describe("OVERSIGHT_CYCLE", () => {
    it("returns SUBJECT_NOT_FOUND when archive does not exist", async () => {
      mocks.loadOversightCycleArchive.mockResolvedValueOnce(null);

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "OVERSIGHT_CYCLE",
        subjectId: "cycle_missing",
        viewerEmail: "user@example.com",
        viewerIsAdmin: false,
      });

      expect(result).toEqual({
        ok: false,
        status: 404,
        reason: "SUBJECT_NOT_FOUND",
      });
    });

    it("allows admin without organisation/retainer checks", async () => {
      mocks.loadOversightCycleArchive.mockResolvedValueOnce({
        record: { accountId: "acc_001", organisationId: "org_001" },
      });

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "OVERSIGHT_CYCLE",
        subjectId: "cycle_001",
        viewerEmail: "admin@example.com",
        viewerIsAdmin: true,
      });

      expect(result).toEqual({
        ok: true,
        subjectType: "OVERSIGHT_CYCLE",
        subjectId: "cycle_001",
      });
      expect(mocks.prisma.organisationMembership.findFirst).not.toHaveBeenCalled();
      expect(mocks.verifyRetainerAccess).not.toHaveBeenCalled();
    });

    it("returns SUBJECT_ACCESS_REQUIRED when viewer has no email", async () => {
      mocks.loadOversightCycleArchive.mockResolvedValueOnce({
        record: { accountId: "acc_001", organisationId: "org_001" },
      });

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "OVERSIGHT_CYCLE",
        subjectId: "cycle_001",
        viewerEmail: null,
        viewerIsAdmin: false,
      });

      expect(result).toEqual({
        ok: false,
        status: 403,
        reason: "SUBJECT_ACCESS_REQUIRED",
      });
    });

    it("returns ORGANISATION_ACCESS_REQUIRED when viewer is not in organisation", async () => {
      mocks.loadOversightCycleArchive.mockResolvedValueOnce({
        record: { accountId: "acc_001", organisationId: "org_001" },
      });
      mocks.prisma.organisationMembership.findFirst.mockResolvedValueOnce(null);

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "OVERSIGHT_CYCLE",
        subjectId: "cycle_001",
        viewerEmail: "other@example.com",
        viewerIsAdmin: false,
      });

      expect(result).toEqual({
        ok: false,
        status: 403,
        reason: "ORGANISATION_ACCESS_REQUIRED",
      });
    });

    it("returns RETAINER_ACCESS_REQUIRED when retainer access fails", async () => {
      mocks.loadOversightCycleArchive.mockResolvedValueOnce({
        record: { accountId: "acc_001", organisationId: "org_001" },
      });
      mocks.prisma.organisationMembership.findFirst.mockResolvedValueOnce({ id: "membership_001" });
      mocks.verifyRetainerAccess.mockResolvedValueOnce({ ok: false });

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "OVERSIGHT_CYCLE",
        subjectId: "cycle_001",
        viewerEmail: "member@example.com",
        viewerIsAdmin: false,
      });

      expect(result).toEqual({
        ok: false,
        status: 403,
        reason: "RETAINER_ACCESS_REQUIRED",
      });
    });

    it("grants access when organisation membership and retainer access both pass", async () => {
      mocks.loadOversightCycleArchive.mockResolvedValueOnce({
        record: { accountId: "acc_001", organisationId: "org_001" },
      });
      mocks.prisma.organisationMembership.findFirst.mockResolvedValueOnce({ id: "membership_001" });
      mocks.verifyRetainerAccess.mockResolvedValueOnce({ ok: true });

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "OVERSIGHT_CYCLE",
        subjectId: "cycle_001",
        viewerEmail: "member@example.com",
        viewerIsAdmin: false,
      });

      expect(result).toEqual({
        ok: true,
        subjectType: "OVERSIGHT_CYCLE",
        subjectId: "cycle_001",
      });
    });
  });

  describe("RETAINER_ACCOUNT", () => {
    it("returns SUBJECT_NOT_FOUND when contract does not exist", async () => {
      mocks.prisma.retainerContract.findUnique.mockResolvedValueOnce(null);

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "RETAINER_ACCOUNT",
        subjectId: "contract_missing",
        viewerEmail: "user@example.com",
        viewerIsAdmin: false,
      });

      expect(result).toEqual({
        ok: false,
        status: 404,
        reason: "SUBJECT_NOT_FOUND",
      });
    });

    it("allows admin without organisation/retainer checks", async () => {
      mocks.prisma.retainerContract.findUnique.mockResolvedValueOnce({
        id: "contract_001",
        organisationId: "org_001",
      });

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "RETAINER_ACCOUNT",
        subjectId: "contract_001",
        viewerEmail: "admin@example.com",
        viewerIsAdmin: true,
      });

      expect(result).toEqual({
        ok: true,
        subjectType: "RETAINER_ACCOUNT",
        subjectId: "contract_001",
      });
      expect(mocks.prisma.organisationMembership.findFirst).not.toHaveBeenCalled();
    });

    it("returns SUBJECT_ACCESS_REQUIRED when viewer has no email", async () => {
      mocks.prisma.retainerContract.findUnique.mockResolvedValueOnce({
        id: "contract_001",
        organisationId: "org_001",
      });

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "RETAINER_ACCOUNT",
        subjectId: "contract_001",
        viewerEmail: null,
        viewerIsAdmin: false,
      });

      expect(result).toEqual({
        ok: false,
        status: 403,
        reason: "SUBJECT_ACCESS_REQUIRED",
      });
    });

    it("returns ORGANISATION_ACCESS_REQUIRED when viewer is not in organisation", async () => {
      mocks.prisma.retainerContract.findUnique.mockResolvedValueOnce({
        id: "contract_001",
        organisationId: "org_001",
      });
      mocks.prisma.organisationMembership.findFirst.mockResolvedValueOnce(null);

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "RETAINER_ACCOUNT",
        subjectId: "contract_001",
        viewerEmail: "other@example.com",
        viewerIsAdmin: false,
      });

      expect(result).toEqual({
        ok: false,
        status: 403,
        reason: "ORGANISATION_ACCESS_REQUIRED",
      });
    });

    it("grants access when all checks pass", async () => {
      mocks.prisma.retainerContract.findUnique.mockResolvedValueOnce({
        id: "contract_001",
        organisationId: "org_001",
      });
      mocks.prisma.organisationMembership.findFirst.mockResolvedValueOnce({ id: "membership_001" });
      mocks.verifyRetainerAccess.mockResolvedValueOnce({ ok: true });

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "RETAINER_ACCOUNT",
        subjectId: "contract_001",
        viewerEmail: "member@example.com",
        viewerIsAdmin: false,
      });

      expect(result).toEqual({
        ok: true,
        subjectType: "RETAINER_ACCOUNT",
        subjectId: "contract_001",
      });
    });
  });

  describe("EXECUTIVE_REPORT", () => {
    it("returns SUBJECT_NOT_FOUND when run does not exist", async () => {
      mocks.prisma.retainerContract.findUnique.mockResolvedValueOnce(null);
      // EXECUTIVE_REPORT uses prisma.$queryRaw or prisma.executiveReportingRun
      // We need to mock the dynamic access
      // Since the module uses (prisma as any).executiveReportingRun, we mock it on the prisma object
      mocks.prisma.executiveReportingRun = {
        findFirst: vi.fn().mockResolvedValueOnce(null),
      };

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "EXECUTIVE_REPORT",
        subjectId: "run_missing",
        viewerEmail: "user@example.com",
        viewerIsAdmin: false,
      });

      expect(result).toEqual({
        ok: false,
        status: 404,
        reason: "SUBJECT_NOT_FOUND",
      });
    });

    it("allows admin without email match", async () => {
      mocks.prisma.executiveReportingRun = {
        findFirst: vi.fn().mockResolvedValueOnce({
          id: "run_001",
          runKey: "RK-001",
          email: "owner@example.com",
        }),
      };

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "EXECUTIVE_REPORT",
        subjectId: "run_001",
        viewerEmail: "admin@example.com",
        viewerIsAdmin: true,
      });

      expect(result).toEqual({
        ok: true,
        subjectType: "EXECUTIVE_REPORT",
        subjectId: "run_001",
      });
    });

    it("allows non-admin when email matches run owner", async () => {
      mocks.prisma.executiveReportingRun = {
        findFirst: vi.fn().mockResolvedValueOnce({
          id: "run_001",
          runKey: "RK-001",
          email: "owner@example.com",
        }),
      };

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "EXECUTIVE_REPORT",
        subjectId: "run_001",
        viewerEmail: "owner@example.com",
        viewerIsAdmin: false,
      });

      expect(result).toEqual({
        ok: true,
        subjectType: "EXECUTIVE_REPORT",
        subjectId: "run_001",
      });
    });

    it("returns SUBJECT_ACCESS_REQUIRED when non-admin email does not match", async () => {
      mocks.prisma.executiveReportingRun = {
        findFirst: vi.fn().mockResolvedValueOnce({
          id: "run_001",
          runKey: "RK-001",
          email: "owner@example.com",
        }),
      };

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "EXECUTIVE_REPORT",
        subjectId: "run_001",
        viewerEmail: "other@example.com",
        viewerIsAdmin: false,
      });

      expect(result).toEqual({
        ok: false,
        status: 403,
        reason: "SUBJECT_ACCESS_REQUIRED",
      });
    });
  });

  describe("DELIVERY_ITEM", () => {
    it("returns SUBJECT_NOT_FOUND when no deliveries match", async () => {
      mocks.listAllDeliveries.mockResolvedValueOnce([]);

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "DELIVERY_ITEM",
        subjectId: "delivery_missing",
        viewerEmail: "user@example.com",
        viewerIsAdmin: false,
      });

      expect(result).toEqual({
        ok: false,
        status: 404,
        reason: "SUBJECT_NOT_FOUND",
      });
    });

    it("allows admin without email match", async () => {
      mocks.listAllDeliveries.mockResolvedValueOnce([
        { id: "delivery_001", artifactId: "artifact_001", recipientEmail: "client@example.com" },
      ]);

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "DELIVERY_ITEM",
        subjectId: "delivery_001",
        viewerEmail: "admin@example.com",
        viewerIsAdmin: true,
      });

      expect(result).toEqual({
        ok: true,
        subjectType: "DELIVERY_ITEM",
        subjectId: "delivery_001",
      });
    });

    it("allows non-admin when email matches recipient", async () => {
      mocks.listAllDeliveries.mockResolvedValueOnce([
        { id: "delivery_001", artifactId: "artifact_001", recipientEmail: "client@example.com" },
      ]);

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "DELIVERY_ITEM",
        subjectId: "delivery_001",
        viewerEmail: "client@example.com",
        viewerIsAdmin: false,
      });

      expect(result).toEqual({
        ok: true,
        subjectType: "DELIVERY_ITEM",
        subjectId: "delivery_001",
      });
    });

    it("returns SUBJECT_ACCESS_REQUIRED when non-admin email does not match any recipient", async () => {
      mocks.listAllDeliveries.mockResolvedValueOnce([
        { id: "delivery_001", artifactId: "artifact_001", recipientEmail: "client@example.com" },
      ]);

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "DELIVERY_ITEM",
        subjectId: "delivery_001",
        viewerEmail: "other@example.com",
        viewerIsAdmin: false,
      });

      expect(result).toEqual({
        ok: false,
        status: 403,
        reason: "SUBJECT_ACCESS_REQUIRED",
      });
    });

    it("matches by artifactId as well as id", async () => {
      mocks.listAllDeliveries.mockResolvedValueOnce([
        { id: "delivery_001", artifactId: "artifact_001", recipientEmail: "client@example.com" },
      ]);

      const result = await authorizeClientSafeProvenanceSubject({
        subjectType: "DELIVERY_ITEM",
        subjectId: "artifact_001",
        viewerEmail: "client@example.com",
        viewerIsAdmin: false,
      });

      expect(result).toEqual({
        ok: true,
        subjectType: "DELIVERY_ITEM",
        subjectId: "artifact_001",
      });
    });
  });
});
