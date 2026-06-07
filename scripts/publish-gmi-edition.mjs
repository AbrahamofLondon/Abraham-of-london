import "dotenv/config";

import {
  assertGmiEditionPublishable,
  createAndPersistGmiReleaseSnapshot,
  getLatestSnapshot,
} from "../lib/intelligence/gmi-release-authority.ts";
import {
  createGmiBoardPackArtifact,
  releaseSnapshotStateHash,
} from "../lib/intelligence/gmi-board-pack-artifact-service.server.ts";
import { prisma } from "../lib/prisma.ts";

const editionId = process.argv[2] || "GMI-Q2-2026";
const actor = process.argv[3] || "codex-release-closure";

const publishable = await assertGmiEditionPublishable(editionId);
if (!publishable.ok) {
  console.log(JSON.stringify({
    ok: false,
    editionId,
    blockers: publishable.blockers.map((blocker) => ({
      category: blocker.category,
      message: blocker.message,
    })),
  }, null, 2));
  process.exit(1);
}

const snapshot = await createAndPersistGmiReleaseSnapshot(editionId, {
  createdBy: actor,
  publishedBy: actor,
});
const persistedSnapshot = await getLatestSnapshot(editionId);
if (!persistedSnapshot || persistedSnapshot.id !== snapshot.id) {
  throw new Error("Persisted final snapshot could not be reloaded for artifact hashing.");
}

const artifact = await createGmiBoardPackArtifact({
  editionId,
  snapshotId: snapshot.id,
  artifactType: "board_pack_pdf",
  generatedBy: actor,
  generatedFromStateHash: releaseSnapshotStateHash(persistedSnapshot),
});

await prisma.$executeRaw`
  UPDATE "gmi_edition_governance_state"
  SET
    "publication_status" = 'published',
    "board_pack_generated_at" = ${new Date(artifact.generatedAt)},
    "board_pulse_published_at" = COALESCE("board_pulse_published_at", NOW()),
    "operator_brief_published_at" = COALESCE("operator_brief_published_at", NOW()),
    "updated_at" = NOW()
  WHERE "edition_id" = ${editionId}
`;

console.log(JSON.stringify({
  ok: true,
  editionId,
  snapshotId: snapshot.id,
  artifactId: artifact.id,
  status: "PUBLISHED",
  contentHash: artifact.contentHash,
  generatedFromStateHash: artifact.generatedFromStateHash,
}, null, 2));
