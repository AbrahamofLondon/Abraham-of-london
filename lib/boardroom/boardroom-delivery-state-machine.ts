/**
 * lib/boardroom/boardroom-delivery-state-machine.ts
 *
 * SERVER-ONLY compatibility wrapper.
 *
 * Re-exports all shared types/validators/helpers from the client-safe module
 * and adds the server-only event recording from the events server module.
 *
 * API routes and server code should continue to import from this file.
 * Pages Router pages must import from the .shared module instead.
 *
 * This file imports "server-only" via boardroom-delivery-events.server.
 */

import "server-only";

// Re-export everything from the shared module (types, validators, helpers)
export {
  // Types
  type BoardroomDeliveryStatus,
  type BoardroomArtifactStatus,
  type BoardroomArtifactDeliveryStatus,
  type BoardroomAuditEvent,

  // State machine data
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_COLORS,

  // Validation
  isValidTransition,
  assertValidTransition,

  // Delivery readiness
  type DeliveryReadinessCheck,
  checkDeliveryReadiness,

  // Legacy mapping
  mapLegacyStatus,
  toLegacyStatus,
} from "./boardroom-delivery-state-machine.shared";

// Re-export server-only event recording
export { recordBoardroomDeliveryEvent } from "./boardroom-delivery-events.server";