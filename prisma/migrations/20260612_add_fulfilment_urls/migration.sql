-- Add adminPreviewUrl and customerAccessUrl fields to ProductArtifact
-- for the Universal Fulfilment Integrity Layer.

ALTER TABLE "product_artifacts" 
ADD COLUMN IF NOT EXISTS "admin_preview_url" TEXT,
ADD COLUMN IF NOT EXISTS "customer_access_url" TEXT;