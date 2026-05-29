/**
 * lib/research/engines/boardroom-dossier-adapter.ts
 *
 * Canonical export point for the Boardroom Dossier adapter.
 *
 * Engine registry ID: "boardroom-dossier"
 * Implementation:     boardroom-mode-adapter.ts (historical file name)
 *
 * This shim aligns the import path with the engine-registry identity
 * without breaking the existing import sites (chaos, data-poisoning,
 * performance routes) that still reference boardroom-mode-adapter directly.
 */

export {
  boardroomModeAdapter as boardroomDossierAdapter,
  BOARDROOM_ENGINE_ID,
  BOARDROOM_VERSION,
} from "./boardroom-mode-adapter";
