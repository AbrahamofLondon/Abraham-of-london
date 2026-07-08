-- GMI production release persistence: durable release state, authority, receipt.
-- Additive only — creates three new tables; no changes to existing tables.

-- CreateTable
CREATE TABLE "gmi_edition_release_state" (
    "id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "lifecycle_state" TEXT NOT NULL,
    "candidate_hash" TEXT,
    "source_snapshot_hash" TEXT,
    "report_content_hash" TEXT,
    "methodology_version" TEXT,
    "data_locked_at" TIMESTAMP(3),
    "release_candidate_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "supersedes" TEXT,
    "superseded_by" TEXT,
    "public_visible" BOOLEAN NOT NULL DEFAULT false,
    "purchasable" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmi_edition_release_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmi_release_authorities" (
    "id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "candidate_hash" TEXT NOT NULL,
    "authorized_by" TEXT NOT NULL,
    "authorized_at" TIMESTAMP(3) NOT NULL,
    "authority_scope" TEXT NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "revoked_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gmi_release_authorities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmi_release_receipts" (
    "id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "candidate_hash" TEXT NOT NULL,
    "source_snapshot_hash" TEXT NOT NULL,
    "report_content_hash" TEXT NOT NULL,
    "methodology_version" TEXT NOT NULL,
    "pdf_hash" TEXT,
    "release_checklist_version" TEXT NOT NULL,
    "authority_id" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gmi_release_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gmi_edition_release_state_edition_id_key" ON "gmi_edition_release_state"("edition_id");

-- CreateIndex
CREATE INDEX "gmi_edition_release_state_lifecycle_state_idx" ON "gmi_edition_release_state"("lifecycle_state");

-- CreateIndex
CREATE INDEX "gmi_edition_release_state_superseded_by_idx" ON "gmi_edition_release_state"("superseded_by");

-- CreateIndex
CREATE INDEX "gmi_release_authorities_edition_id_idx" ON "gmi_release_authorities"("edition_id");

-- CreateIndex
CREATE INDEX "gmi_release_authorities_edition_id_candidate_hash_idx" ON "gmi_release_authorities"("edition_id", "candidate_hash");

-- CreateIndex
CREATE INDEX "gmi_release_authorities_revoked_at_idx" ON "gmi_release_authorities"("revoked_at");

-- CreateIndex
CREATE UNIQUE INDEX "gmi_release_receipts_edition_id_key" ON "gmi_release_receipts"("edition_id");

-- CreateIndex
CREATE INDEX "gmi_release_receipts_authority_id_idx" ON "gmi_release_receipts"("authority_id");

-- CreateIndex
CREATE INDEX "gmi_release_receipts_candidate_hash_idx" ON "gmi_release_receipts"("candidate_hash");

-- AddForeignKey
ALTER TABLE "gmi_release_receipts" ADD CONSTRAINT "gmi_release_receipts_authority_id_fkey" FOREIGN KEY ("authority_id") REFERENCES "gmi_release_authorities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gmi_release_receipts" ADD CONSTRAINT "gmi_release_receipts_edition_id_fkey" FOREIGN KEY ("edition_id") REFERENCES "gmi_edition_release_state"("edition_id") ON DELETE RESTRICT ON UPDATE CASCADE;
