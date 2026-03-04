// lib/db/interactions/index.ts

export {
  toggleInteraction,
  getInteractionCounts,
  hasUserInteracted,
  getUserInteractionState, // Export the new helper
} from "../interactions";

export type {
  InteractionAction,
  InteractionCounts,
  InteractionStats,
  UserInteractionState, // Now properly exported
} from "../interactions";