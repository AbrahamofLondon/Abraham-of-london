CREATE TABLE IF NOT EXISTS "gmi_board_pack_artifacts" (
  "id" TEXT NOT NULL,
  "edition_id" TEXT NOT NULL,
  "snapshot_id" TEXT,
  "artifact_type" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "storage_path" TEXT,
  "public_url" TEXT,
  "content_hash" TEXT NOT NULL,
  "generated_from_state_hash" TEXT NOT NULL,
  "generated_at" TIMESTAMP(3) NOT NULL,
  "generated_by" TEXT,
  "status" TEXT NOT NULL DEFAULT 'generated',
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "gmi_board_pack_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "gmi_board_pack_artifacts_edition_id_idx"
  ON "gmi_board_pack_artifacts"("edition_id");
CREATE INDEX IF NOT EXISTS "gmi_board_pack_artifacts_snapshot_id_idx"
  ON "gmi_board_pack_artifacts"("snapshot_id");
CREATE INDEX IF NOT EXISTS "gmi_board_pack_artifacts_artifact_type_idx"
  ON "gmi_board_pack_artifacts"("artifact_type");
CREATE INDEX IF NOT EXISTS "gmi_board_pack_artifacts_status_idx"
  ON "gmi_board_pack_artifacts"("status");
CREATE INDEX IF NOT EXISTS "gmi_board_pack_artifacts_generated_at_idx"
  ON "gmi_board_pack_artifacts"("generated_at");
