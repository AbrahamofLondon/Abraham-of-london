-- Migration: add_contenttype_enum
-- Description: Add ContentType enum that exists in prisma/schema.prisma but was never migrated.
-- This enum is used by the ContentMetadata model's contentType field.

-- Create the ContentType enum
CREATE TYPE "ContentType" AS ENUM (
  'Briefs',
  'Dossier',
  'Operational_Framework',
  'Landing',
  'Leadership',
  'Audit',
  'Research',
  'Sovereign_Intelligence',
  'Lexicon',
  'Intelligence',
  'Prints',
  'Strategy'
);

-- Alter the content_metadata table to use the new enum
ALTER TABLE "content_metadata" 
  ALTER COLUMN "contentType" TYPE "ContentType" 
  USING "contentType"::text::"ContentType";

-- Update the default value
ALTER TABLE "content_metadata" 
  ALTER COLUMN "contentType" SET DEFAULT 'Briefs';