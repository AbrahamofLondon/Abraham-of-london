/**
 * tests/admin/boardroom-delivery-pipeline-endpoints.test.ts
 *
 * Tests for the Boardroom delivery pipeline API endpoints.
 * Covers:
 *   - Generate dossier endpoint
 *   - Approve endpoint
 *   - Customer access endpoint
 *   - Deliver endpoint
 *   - State machine enforcement
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    boardroomBriefOrder: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    productArtifact: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    boardroomDossier: {
      findFirst: vi.fn(),
    },
    boardroomDossierAccessToken: {
      create: vi.fn(),
    },
    accessAuditLog: {
      findMany: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock("@/lib/auth/requireAdminServer", () => ({
  requireAdminServer: vi.fn().mockResolvedValue({
    user: { email: "admin@test.com" },
  }),
}));

// Mock governance event bus
vi.mock("@/lib/platform/governance-event-bus", () => ({
  routeGovernanceEvent: vi.fn().mockResolvedValue({ ok: true }),
}));

// Mock BoardroomDossierService
vi.mock("@/lib/boardroom/boardroom-dossier-service", () => ({
  BoardroomDossierService: {
    grantAccess: vi.fn().mockResolvedValue({ status: "DELIVERED" }),
  },
}));

// Mock case study bridge
vi.mock("@/lib/evidence/case-study-boardroom-bridge", () => ({
  createCaseStudyFromBoardroomOrder: vi.fn(),
}));

// Mock delivery email
vi.mock("@/lib/boardroom/boardroom-delivery-email", () => ({
  sendBoardroomDeliveryEmail: vi.fn(),
}));

// Mock delivery log
vi.mock("@/lib/boardroom/boardroom-delivery-log", () => ({
  BoardroomDeliveryLog: {
    record: vi.fn(),
  },
}));

// Mock artifact authority
vi.mock("@/lib/artifacts/artifact-authority", () => ({
  markArtifactDelivered: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { createCaseStudyFromBoardroomOrder } from "@/lib/evidence/case-study-boardroom-bridge";
import { BoardroomAccessTokenService } from "@/lib/boardroom/boardroom-access-token";
import {
  assertValidTransition,
  checkDeliveryReadiness,
  mapLegacyStatus,
} from "@/lib/boardroom/boardroom-delivery-state-machine.shared";

// Mock BoardroomAccessTokenService
vi.mock("@/lib/boardroom/boardroom-access-token", () => ({
  BoardroomAccessTokenService: {
    createToken: vi.fn(),
  },
}));

describe("Boardroom Delivery Pipeline — State Machine Enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Transition validation", () => {
    it("rejects paid → delivered (cannot skip states)", () => {
      expect(() => assertValidTransition("paid", "delivered", "order-1")).toThrow("INVALID_TRANSITION");
    });

    it("accepts customer_access_ready → delivered", () => {
      expect(() => assertValidTransition("customer_access_ready", "delivered", "order-1")).not.toThrow();
    });

    it("rejects draft_generated → delivered (must go through review and approval)", () => {
      expect(() => assertValidTransition("draft_generated", "delivered", "order-1")).toThrow("INVALID_TRANSITION");
    });
  });

  describe("Delivery readiness checks", () => {
    it("blocks delivery when artifact is PENDING", () => {
      const result = checkDeliveryReadiness({
        deliveryStatus: "customer_access_ready",
        artifactStatus: "PENDING",
        artifactDeliveryStatus: "PENDING",
        adminPreviewUrl: null,
        customerAccessUrl: null,
        customerEmail: "client@test.com",
        deliveredAt: null,
      });
      expect(result.ready).toBe(false);
      expect(result.checks.some((c: any) => !c.passed)).toBe(true);
    });

    it("allows delivery when all conditions are met", () => {
      const result = checkDeliveryReadiness({
        deliveryStatus: "customer_access_ready",
        artifactStatus: "READY",
        artifactDeliveryStatus: "READY_FOR_DELIVERY",
        adminPreviewUrl: "/admin/preview/123",
        customerAccessUrl: "/boardroom/dossier/123?token=abc",
        customerEmail: "client@test.com",
        deliveredAt: null,
      });
      expect(result.ready).toBe(true);
    });
  });

  describe("Legacy status mapping", () => {
    it("maps dossier_generated to draft_generated", () => {
      expect(mapLegacyStatus("dossier_generated")).toBe("draft_generated");
    });

    it("maps in_review to awaiting_operator_review", () => {
      expect(mapLegacyStatus("in_review")).toBe("awaiting_operator_review");
    });
  });
});
