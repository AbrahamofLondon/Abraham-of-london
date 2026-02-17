// lib/pdf/types.ts — shared types for the PDF registry

export type PDFTier = "free" | "member" | "architect" | "inner-circle" | "inner-circle-elite";
export type PaperFormat = "A4" | "Letter" | "A3" | "bundle";
export type PDFFormat = "PDF" | "EXCEL" | "POWERPOINT" | "ZIP" | "BINARY";

export type PDFType =
  | "editorial"
  | "framework"
  | "academic"
  | "strategic"
  | "tool"
  | "canvas"
  | "worksheet"
  | "assessment"
  | "journal"
  | "tracker"
  | "bundle"
  | "toolkit"
  | "playbook"
  | "brief"
  | "checklist"
  | "pack"
  | "blueprint"
  | "liturgy"
  | "study"
  | "other";

export interface PDFItem {
  id: string;
  title: string;
  type: PDFType;
  tier: PDFTier;
  error?: string;

  outputPath: string;

  description?: string;
  excerpt?: string;
  tags?: string[];

  formats?: PaperFormat[];
  format?: PDFFormat;

  isInteractive?: boolean;
  isFillable?: boolean;
  requiresAuth?: boolean;

  version?: string;
  author?: string;
  category?: string;

  createdAt?: string;
  updatedAt?: string;

  priority?: number;
  preload?: boolean;

  // build metadata
  exists?: boolean;
  fileSize?: string;
  lastModified?: string;

  // compatibility (your Vault page references fileUrl)
  fileUrl?: string;
}