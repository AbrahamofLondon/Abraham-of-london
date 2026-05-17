-- Migration: add professional to AccessTier enum
-- Adds the canonical Professional paid tier alongside the legacy inner_circle value.
-- inner_circle rows remain valid and are normalised to professional at runtime.

ALTER TYPE "AccessTier" ADD VALUE IF NOT EXISTS 'professional' BEFORE 'inner_circle';
