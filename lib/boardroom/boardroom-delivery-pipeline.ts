/**
 * lib/boardroom/boardroom-delivery-pipeline.ts
 *
 * Governed delivery pipeline for Boardroom Dossiers.
 *
 * Enforces the rules:
 * 1. A MANUAL_SYNTHETIC_SAMPLE dossier cannot be delivered to a real client.
 * 2. Every delivery requires a secure token (never email-query-param).
 * 3. Source provenance must be resolvable before delivery is authorised.
 * 4. Delivery emits BOARDROOM_DOSSIER_DELIVERED governance event.
 *
 * This is the production delivery gate — not a simulation.
 * Do not call from dry-run / simulation contexts.
 */

import "server-only";

import { BoardroomDossierService } from "@/lib/boardroom/boardroom-dossier-service";
import { BoardroomAccessTokenService } from "@/lib/boardroom/boardroom-access-token";
import {
  BoardroomSourceResolver,
  type DossierSourceType,
  type DossierSourceRecord,
} from "@/lib/boardroom/boardroom-source-resolver";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeliveryAuthorisation =
  | { authorised: true; source: DossierSourceRecord }
  | { authorised: false; reason: string };

export type DeliveryResult = {
  ok: boolean;
  error?: string;
  rawToken?: string;
  deliveryUrl?: string;
  tokenRecord?: import("@/lib/boardroom/boardroom-access-token").BoardroomTokenRecord;
  dossier?: import("@/lib/boardroom/boardroom-dossier-service").DossierDeliveryRecord;
  source?: DossierSourceRecord;
};

export type PipelineDeliverInput = {
  dossierId: string;
  clientEmail: string;
  clientName?: string;
  expiryDays?: number;
  createdBy: string;
};

// ─── Pipeline ─────────────────────────────────────────────────────────────────

export const BoardroomDeliveryPipeline = {

  /**
   * Gate: check whether a dossier is authorised for client delivery.
   *
   * Blocks:
   * - MANUAL_SYNTHETIC_SAMPLE source type (never deliverable to real clients)
   * - Unresolvable source record (data integrity failure)
   * - Dossier not in APPROVED status
   */
  async authorise(dossierId: string): Promise<DeliveryAuthorisation> {
    const dossier = await BoardroomDossierService.getById(dossierId);
    if (!dossier) {
      return { authorised: false, reason: "Dossier not found" };
    }

    if (dossier.status !== "APPROVED") {
      return {
        authorised: false,
        reason: `Dossier status is "${dossier.status}" — must be APPROVED before delivery`,
      };
    }

    const sourceType = ((dossier as any).sourceType ?? "MANUAL_SYNTHETIC_SAMPLE") as DossierSourceType;
    const sourceId = (dossier as any).sourceId as string | null;

    // Samples are never deliverable
    if (!BoardroomSourceResolver.isDeliverable(sourceType)) {
      return {
        authorised: false,
        reason:
          "Dossier source is MANUAL_SYNTHETIC_SAMPLE. " +
          "Sample dossiers cannot be delivered to real clients. " +
          "Re-generate from a verified EXECUTIVE_REPORT, DIAGNOSTIC_RUN, or ER_BOARDROOM_BRIDGE_RUN source.",
      };
    }

    // Resolve the source record to confirm it exists
    const resolution = await BoardroomSourceResolver.resolve(sourceType, sourceId);
    if (!resolution.ok) {
      return {
        authorised: false,
        reason: `Source record could not be resolved: ${resolution.reason}`,
      };
    }

    return { authorised: true, source: resolution.source };
  },

  /**
   * Execute delivery: authorise, create secure token, mark as DELIVERED.
   *
   * Returns the raw token exactly once. The caller must transmit it to the client.
   * If authorisation fails, no token is created and no status is changed.
   */
  async deliver(input: PipelineDeliverInput): Promise<DeliveryResult> {
    // Step 1: Authorisation gate
    const auth = await this.authorise(input.dossierId);
    if (!auth.authorised) {
      return { ok: false, error: auth.reason };
    }

    // Step 2: Create secure delivery token
    const tokenResult = await BoardroomAccessTokenService.createToken({
      dossierId: input.dossierId,
      clientEmail: input.clientEmail,
      clientName: input.clientName,
      expiryDays: input.expiryDays,
      createdBy: input.createdBy,
    });

    // Step 3: Mark dossier as DELIVERED
    const dossier = await BoardroomDossierService.grantAccess({
      dossierId: input.dossierId,
      clientEmail: input.clientEmail,
      clientName: input.clientName,
      grantedBy: input.createdBy,
    });

    return {
      ok: true,
      rawToken: tokenResult.rawToken,
      deliveryUrl: tokenResult.deliveryUrl,
      tokenRecord: tokenResult.record,
      dossier,
      source: auth.source,
    };
  },

  /**
   * Preview: check delivery readiness without creating a token or mutating state.
   * Returns the delivery authorisation and source summary for admin preview.
   */
  async previewDelivery(dossierId: string): Promise<DeliveryAuthorisation> {
    return this.authorise(dossierId);
  },
};
