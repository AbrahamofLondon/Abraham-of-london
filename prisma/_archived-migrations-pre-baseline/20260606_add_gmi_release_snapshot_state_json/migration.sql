ALTER TABLE "gmi_release_snapshots"
  ADD COLUMN IF NOT EXISTS "state_json" JSONB;
