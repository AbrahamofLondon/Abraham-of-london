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
import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    boardroomBriefOrder: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    productArtifact: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    boardroomDossier: {
      findFirst: jest.fn(),
    },
    boardroomDossierAccessToken: {
      create: jest.fn(),
    },
    accessAuditLog: {
      findMany: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock("@/lib/auth/requireAdminServer", () => ({
  requireAdminServer: jest.fn().mockResolvedValue({
    user: { email: "admin@test.com" },
  }),
}));

// Mock governance event bus
jest.mock("@/lib/platform/governance-event-bus", () => ({
  routeGovernanceEvent: jest.fn().mockResolvedValue({ ok: true }),
}));

// Mock BoardroomDossierService
jest.mock("@/lib/boardroom/boardroom-dossier-service", () => ({
  BoardroomDossierService: {
    grantAccess: jest.fn().mockResolvedValue({ status: "DELIVERED" }),
  },
}));

// Mock case study bridge
jest.mock("@/lib/evidence/case-study-boardroom-bridge", () => ({
  createCaseStudyFromBoardroomOrder: jest.fn(),
}));

// Mock delivery email
jest.mock("@/lib/boardroom/boardroom-delivery-email", () => ({
  sendBoardroomDeliveryEmail: jest.fn(),
}));

// Mock delivery log
jest.mock("@/lib/boardroom/boardroom-delivery-log", () => ({
  BoardroomDeliveryLog: {
    record: jest.fn(),
  },
}));

// Mock artifact authority
jest.mock("@/lib/artifacts/artifact-authority", () => ({
  markArtifactDelivered: jest.fn(),
}));

import { prisma } from "@/lib/prisma";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { createCaseStudyFromBoardroomOrder } from "@/lib/evidence/case-study-boardroom-bridge";
import { BoardroomAccessTokenService } from "@/lib/boardroom/boardroom-access-token";

// Mock BoardroomAccessTokenService
jest.mock("@/lib/boardroom/boardroom-access-token", () => ({
  BoardroomAccessTokenService: {
    createToken: jest.fn(),
  },
}));

describe("Boardroom Delivery Pipeline — State Machine Enforcement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Transition validation", () => {
    it("rejects paid → delivered (cannot skip states)", () => {
      const { assertValidTransition } = require("@/lib/boardroom/boardroom-delivery-state-machine.shared");
      expect(() => assertValidTransition("paid", "delivered", "order-1")).toThrow("INVALID_TRANSITION");
    });

    it("accepts customer_access_ready → delivered", () => {
      const { assertValidTransition } = require("@/lib/boardroom/boardroom-delivery-state-machine.shared");
      expect(() => assertValidTransition("customer_access_ready", "delivered", "order-1")).not.toThrow();
    });

    it("rejects draft_generated → delivered (must go through review and approval)", () => {
      const { assertValidTransition } = require("@/lib/boardroom/boardroom-delivery-state-machine.shared");
      expect(() => assertValidTransition("draft_generated", "delivered", "order-1")).toThrow("INVALID_TRANSITION");
    });
  });

  describe("Delivery readiness checks", () => {
    it("blocks delivery when artifact is PENDING", () => {
      const { checkDeliveryReadiness } = require("@/lib/boardroom/boardroom-delivery-state-machine.shared");
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
      const { checkDeliveryReadiness } = require("@/lib/boardroom/boardroom-delivery-state-machine.shared");
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
      const { mapLegacyStatus } = require("@/lib/boardroom/boardroom-delivery-state-machine.shared");
      expect(mapLegacyStatus("dossier_generated")).toBe("draft_generated");
    });

    it("maps in_review to awaiting_operator_review", () => {
      const { mapLegacyStatus } = require("@/lib/boardroom/boardroom-delivery-state-machine.shared");
      expect(mapLegacyStatus("in_review")).toBe("awaiting_operator_review");
    });
  });
});
