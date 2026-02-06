// scripts/pdf/pdf-registry.source.ts
import fs from "fs";
import path from "path";

// --- TYPES ---
export type Tier = "free" | "member" | "architect" | "inner-circle" | "inner-circle-elite";
export type PDFType = "editorial" | "framework" | "academic" | "strategic" | "tool" | "canvas" | "worksheet" | "assessment" | "journal" | "tracker" | "bundle" | "toolkit" | "playbook" | "brief" | "checklist" | "pack" | "blueprint" | "liturgy" | "study" | "other";
export type PDFFormat = "PDF" | "EXCEL" | "POWERPOINT" | "ZIP" | "BINARY";
export type PaperFormat = "A4" | "Letter" | "A3" | "bundle";

export type SourcePDFItem = {
  id: string;
  title: string;
  type: PDFType;
  tier: Tier;
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
};

/**
 * Smart Path Resolver: 
 * Validates which folder the PDF actually exists in to prevent registry mismatch.
 */
function definePDF(input: SourcePDFItem): SourcePDFItem {
  const root = process.cwd();
  const fileName = path.basename(input.outputPath);
  
  // Define possible search locations (in priority order)
  // Check content-downloads FIRST since that's where most files are
  const possiblePaths = [
    `/assets/downloads/content-downloads/${fileName}`,
    input.outputPath, // The path as provided
    `/assets/downloads/${fileName}`,
    `/vault/downloads/lib-pdf/${fileName}`
  ];

  let resolvedPath = input.outputPath;

  // Systematic check: find the first path that actually exists on disk
  for (const p of possiblePaths) {
    const fullPath = path.join(root, 'public', p.startsWith('/') ? p.slice(1) : p);
    if (fs.existsSync(fullPath)) {
      resolvedPath = p.startsWith('/') ? p : `/${p}`;
      console.log(`✅ Resolved ${fileName} to ${resolvedPath}`);
      break;
    }
  }

  return {
    ...input,
    outputPath: resolvedPath,
    format: input.format || "PDF",
    formats: input.formats || ["A4"],
    isInteractive: input.isInteractive || false,
    isFillable: input.isFillable || false,
    requiresAuth: input.requiresAuth || false,
    version: input.version || "1.0.0",
    author: input.author || "Abraham of London",
    tags: input.tags || [],
    category: input.category || "general",
  };
}

export const EXISTING_PDFS: SourcePDFItem[] = [
  // --- CONTENT-DOWNLOADS DIRECTORY (Files actually exist here) ---
  definePDF({
    id: "abraham-vault-pack",
    title: "Abraham Vault Pack",
    type: "bundle",
    tier: "free",
    outputPath: "/assets/downloads/abraham-vault-pack.pdf", // Will be resolved to content-downloads
    category: "vault",
    description: "Comprehensive vault pack with foundational resources",
  }),
  definePDF({
    id: "board-decision-log-template",
    title: "Board Decision Log Template",
    type: "tool",
    tier: "free",
    outputPath: "/assets/downloads/board-decision-log-template.pdf",
    category: "governance",
    description: "Template for tracking board decisions and resolutions",
  }),
  definePDF({
    id: "board-investor-onepager",
    title: "Board Investor One-Pager",
    type: "tool",
    tier: "free",
    outputPath: "/assets/downloads/board-investor-onepager.pdf",
    category: "governance",
    description: "One-page summary for board and investor communications",
  }),
  definePDF({
    id: "brotherhood-covenant",
    title: "Brotherhood Covenant",
    type: "framework",
    tier: "free",
    outputPath: "/assets/downloads/brotherhood-covenant.pdf",
    category: "leadership",
    description: "Covenant framework for brotherhood and fellowship",
  }),
  definePDF({
    id: "brotherhood-leader-guide",
    title: "Brotherhood Leader Guide",
    type: "toolkit",
    tier: "free",
    outputPath: "/assets/downloads/brotherhood-leader-guide.pdf",
    category: "leadership",
    description: "Guide for leading brotherhood groups and communities",
  }),
  definePDF({
    id: "brotherhood-starter-kit",
    title: "Brotherhood Starter Kit",
    type: "toolkit",
    tier: "free",
    outputPath: "/assets/downloads/brotherhood-starter-kit.pdf",
    category: "leadership",
    description: "Starter kit for establishing brotherhood groups",
  }),
  definePDF({
    id: "canon-volume-iv-diagnostic-toolkit",
    title: "Canon Volume IV Diagnostic Toolkit",
    type: "toolkit",
    tier: "free",
    outputPath: "/assets/downloads/canon-volume-iv-diagnostic-toolkit.pdf",
    category: "canon",
    description: "Diagnostic tools from Canon Volume IV",
  }),
  definePDF({
    id: "canon-volume-v-governance-diagnostic-toolkit",
    title: "Canon Volume V Governance Diagnostic Toolkit",
    type: "toolkit",
    tier: "free",
    outputPath: "/assets/downloads/canon-volume-v-governance-diagnostic-toolkit.pdf",
    category: "governance",
    description: "Governance diagnostic tools from Canon Volume V",
  }),
  definePDF({
    id: "communication-script-bpf",
    title: "Communication Script (BPF)",
    type: "tool",
    tier: "free",
    outputPath: "/assets/downloads/communication-script-bpf.pdf",
    category: "leadership",
    description: "Business Process Framework communication script",
  }),
  definePDF({
    id: "core-alignment",
    title: "Core Alignment Framework",
    type: "framework",
    tier: "free",
    outputPath: "/assets/downloads/core-alignment.pdf",
    category: "personal-growth",
    description: "Framework for aligning with core values and purpose",
  }),
  definePDF({
    id: "core-legacy",
    title: "Core Legacy Framework",
    type: "framework",
    tier: "free",
    outputPath: "/assets/downloads/core-legacy.pdf",
    category: "legacy",
    description: "Framework for building and sustaining legacy",
  }),
  definePDF({
    id: "decision-log-template",
    title: "Decision Log Template",
    type: "tool",
    tier: "free",
    outputPath: "/assets/downloads/decision-log-template.pdf",
    category: "operations",
    description: "Template for logging and tracking decisions",
  }),
  definePDF({
    id: "decision-matrix-scorecard",
    title: "Decision Matrix Scorecard",
    type: "tool",
    tier: "free",
    outputPath: "/assets/downloads/decision-matrix-scorecard.pdf",
    category: "operations",
    description: "Scorecard for decision matrix evaluation",
  }),
  definePDF({
    id: "download-legacy-architecture-canvas",
    title: "Legacy Architecture Canvas",
    type: "canvas",
    tier: "free",
    outputPath: "/assets/downloads/download-legacy-architecture-canvas.pdf",
    category: "legacy",
    description: "Canvas for designing legacy architecture",
  }),
  definePDF({
    id: "entrepreneur-operating-pack",
    title: "Entrepreneur Operating Pack",
    type: "pack",
    tier: "free",
    outputPath: "/assets/downloads/entrepreneur-operating-pack.pdf",
    category: "operations",
    description: "Operating pack for entrepreneurs",
  }),
  definePDF({
    id: "entrepreneur-survival-checklist",
    title: "Entrepreneur Survival Checklist",
    type: "checklist",
    tier: "free",
    outputPath: "/assets/downloads/entrepreneur-survival-checklist.pdf",
    category: "operations",
    description: "Checklist for entrepreneurial survival and resilience",
  }),
  definePDF({
    id: "family-altar-liturgy",
    title: "Family Altar Liturgy",
    type: "liturgy",
    tier: "free",
    outputPath: "/assets/downloads/family-altar-liturgy.pdf",
    category: "theology",
    description: "Liturgy for family altar and worship",
  }),
  definePDF({
    id: "fathers-family-court-pack",
    title: "Family Court Practical Pack",
    type: "bundle",
    tier: "member",
    outputPath: "/assets/downloads/fathers-family-court-pack.pdf",
    requiresAuth: true,
    category: "family-court",
    description: "Practical resources for family court proceedings",
  }),
  definePDF({
    id: "leaders-cue-card-two-up",
    title: "Leaders Cue Card (Two-Up)",
    type: "tool",
    tier: "free",
    outputPath: "/assets/downloads/leaders-cue-card-two-up.pdf",
    category: "leadership",
    description: "Two-up cue card for leaders",
  }),
  definePDF({
    id: "leadership-playbook",
    title: "Leadership Playbook",
    type: "playbook",
    tier: "free",
    outputPath: "/assets/downloads/leadership-playbook.pdf",
    category: "leadership",
    description: "Comprehensive leadership playbook",
  }),
  definePDF({
    id: "legacy-canvas",
    title: "Legacy Canvas",
    type: "canvas",
    tier: "free",
    outputPath: "/assets/downloads/legacy-canvas.pdf",
    category: "legacy",
    description: "Canvas for legacy planning and design",
  }),
  definePDF({
    id: "legacy-architecture-canvas",
    title: "Legacy Architecture Canvas",
    type: "canvas",
    tier: "free",
    outputPath: "/assets/downloads/legacy-architecture-canvas.pdf",
    category: "legacy",
    description: "High-fidelity legacy architecture canvas",
  }),
  definePDF({
    id: "life-alignment-assessment",
    title: "Life Alignment Assessment",
    type: "assessment",
    tier: "free",
    outputPath: "/assets/downloads/life-alignment-assessment.pdf",
    category: "personal-growth",
    description: "Assessment for life alignment and purpose discovery",
    preload: true,
  }),
  definePDF({
    id: "mentorship-starter-kit",
    title: "Mentorship Starter Kit",
    type: "toolkit",
    tier: "free",
    outputPath: "/assets/downloads/mentorship-starter-kit.pdf",
    category: "leadership",
    description: "Starter kit for mentorship relationships",
  }),
  definePDF({
    id: "operating-cadence-pack",
    title: "Operating Cadence Pack",
    type: "pack",
    tier: "free",
    outputPath: "/assets/downloads/operating-cadence-pack.pdf",
    category: "operations",
    description: "Pack for establishing operating cadence",
  }),
  definePDF({
    id: "personal-alignment-assessment-fillable",
    title: "Personal Alignment Assessment (Fillable)",
    type: "assessment",
    tier: "free",
    outputPath: "/assets/downloads/personal-alignment-assessment-fillable.pdf",
    isInteractive: true,
    isFillable: true,
    category: "personal-growth",
    description: "Fillable assessment for personal alignment",
  }),
  definePDF({
    id: "principles-for-my-son",
    title: "Principles for My Son",
    type: "editorial",
    tier: "free",
    outputPath: "/assets/downloads/principles-for-my-son.pdf",
    category: "family",
    description: "Editorial on principles for raising sons",
  }),
  definePDF({
    id: "principles-for-my-son-cue-card",
    title: "Principles for My Son (Cue Card)",
    type: "tool",
    tier: "free",
    outputPath: "/assets/downloads/principles-for-my-son-cue-card.pdf",
    category: "family",
    description: "Cue card version of principles for sons",
  }),
  definePDF({
    id: "purpose-pyramid-worksheet",
    title: "Purpose Pyramid Worksheet",
    type: "worksheet",
    tier: "free",
    outputPath: "/assets/downloads/purpose-pyramid-worksheet.pdf",
    category: "personal-growth",
    description: "Worksheet for purpose pyramid development",
  }),
  definePDF({
    id: "scripture-track-john14",
    title: "Scripture Track: John 14",
    type: "study",
    tier: "free",
    outputPath: "/assets/downloads/scripture-track-john14.pdf",
    category: "theology",
    description: "Scripture study track for John 14",
  }),
  definePDF({
    id: "standards-brief",
    title: "Standards Brief",
    type: "brief",
    tier: "free",
    outputPath: "/assets/downloads/standards-brief.pdf",
    category: "leadership",
    description: "Brief on leadership and operational standards",
  }),
  definePDF({
    id: "surrender-framework",
    title: "Surrender Framework",
    type: "framework",
    tier: "free",
    outputPath: "/assets/downloads/surrender-framework.pdf",
    category: "personal-growth",
    description: "Framework for spiritual and personal surrender",
  }),
  definePDF({
    id: "surrender-principles",
    title: "Surrender Principles",
    type: "editorial",
    tier: "free",
    outputPath: "/assets/downloads/surrender-principles.pdf",
    category: "personal-growth",
    description: "Principles of surrender in life and leadership",
  }),
  definePDF({
    id: "ultimate-purpose-of-man-editorial",
    title: "Ultimate Purpose of Man (Editorial)",
    type: "editorial",
    tier: "free",
    outputPath: "/assets/downloads/ultimate-purpose-of-man-editorial.pdf",
    category: "theology",
    description: "Editorial on the ultimate purpose of man",
  }),
  definePDF({
    id: "ultimate-purpose-of-man-editorial-a4-premium-architect",
    title: "Ultimate Purpose of Man (A4 Premium)",
    type: "editorial",
    tier: "architect",
    outputPath: "/assets/downloads/ultimate-purpose-of-man-editorial-a4-premium-architect.pdf",
    category: "theology",
    description: "Premium A4 version of Ultimate Purpose of Man",
  }),
  definePDF({
    id: "weekly-operating-rhythm",
    title: "Weekly Operating Rhythm",
    type: "tool",
    tier: "free",
    outputPath: "/assets/downloads/weekly-operating-rhythm.pdf",
    category: "operations",
    description: "Template for weekly operating rhythm and cadence",
  }),

  // --- ROOT DOWNLOADS DIRECTORY (Files that actually exist in root) ---
  definePDF({
    id: "decision-matrix-scorecard-fillable",
    title: "Decision Matrix Scorecard (Fillable)",
    type: "tool",
    tier: "free",
    outputPath: "/assets/downloads/decision-matrix-scorecard-fillable.pdf",
    isInteractive: true,
    isFillable: true,
    category: "operations",
    description: "Fillable version of decision matrix scorecard",
  }),
  definePDF({
    id: "legacy-canvas-fillable",
    title: "Legacy Canvas (Fillable)",
    type: "canvas",
    tier: "free",
    outputPath: "/assets/downloads/legacy-canvas-fillable.pdf",
    isInteractive: true,
    isFillable: true,
    category: "legacy",
    description: "Fillable version of legacy canvas",
  }),
  definePDF({
    id: "legacy-architecture-canvas-a3-premium-architect",
    title: "Legacy Architecture Canvas (A3)",
    type: "canvas",
    tier: "free",
    outputPath: "/assets/downloads/legacy-architecture-canvas-a3-premium-architect.pdf",
    category: "legacy",
    description: "A3 premium version of legacy architecture canvas",
  }),
  definePDF({
    id: "legacy-architecture-canvas-a4-premium-architect",
    title: "Legacy Architecture Canvas (A4)",
    type: "canvas",
    tier: "free",
    outputPath: "/assets/downloads/legacy-architecture-canvas-a4-premium-architect.pdf",
    category: "legacy",
    description: "A4 premium version of legacy architecture canvas",
  }),
  definePDF({
    id: "legacy-architecture-canvas-letter-premium-architect",
    title: "Legacy Architecture Canvas (Letter)",
    type: "canvas",
    tier: "free",
    outputPath: "/assets/downloads/legacy-architecture-canvas-letter-premium-architect.pdf",
    category: "legacy",
    description: "Letter premium version of legacy architecture canvas",
  }),
  definePDF({
    id: "purpose-pyramid-worksheet-fillable",
    title: "Purpose Pyramid Worksheet (Fillable)",
    type: "worksheet",
    tier: "free",
    outputPath: "/assets/downloads/purpose-pyramid-worksheet-fillable.pdf",
    isInteractive: true,
    isFillable: true,
    category: "personal-growth",
    description: "Fillable version of purpose pyramid worksheet",
  }),

  // --- LIB-PDF DIRECTORY ---
  definePDF({
    id: "lib-brotherhood-leader-guide",
    title: "Brotherhood Leader Guide (Library)",
    type: "toolkit",
    tier: "member",
    outputPath: "/assets/downloads/lib-pdf/brotherhood-leader-guide.pdf",
    category: "leadership",
    description: "Library version of brotherhood leader guide",
  }),
  definePDF({
    id: "lib-brotherhood-starter-kit",
    title: "Brotherhood Starter Kit (Library)",
    type: "toolkit",
    tier: "free",
    outputPath: "/assets/downloads/lib-pdf/brotherhood-starter-kit.pdf",
    category: "leadership",
    description: "Library version of brotherhood starter kit",
  }),
  definePDF({
    id: "lib-decision-log",
    title: "Decision Log Template (Library)",
    type: "tool",
    tier: "free",
    outputPath: "/assets/downloads/lib-pdf/decision-log-template.pdf",
    category: "operations",
    description: "Library version of decision log template",
  }),
  definePDF({
    id: "lib-decision-matrix-fillable",
    title: "Decision Matrix Scorecard (Fillable Library)",
    type: "tool",
    tier: "free",
    outputPath: "/assets/downloads/lib-pdf/decision-matrix-scorecard-fillable.pdf",
    isInteractive: true,
    isFillable: true,
    category: "operations",
    description: "Library fillable version of decision matrix",
  }),
  definePDF({
    id: "lib-family-court-pack",
    title: "Family Court Practical Pack (Library)",
    type: "bundle",
    tier: "member",
    outputPath: "/assets/downloads/lib-pdf/fathers-family-court-pack.pdf",
    requiresAuth: true,
    category: "family-court",
    description: "Library version of family court pack",
  }),
  definePDF({
    id: "lib-legacy-canvas-fillable",
    title: "Legacy Canvas (Fillable Library)",
    type: "canvas",
    tier: "free",
    outputPath: "/assets/downloads/lib-pdf/legacy-canvas-fillable.pdf",
    isInteractive: true,
    isFillable: true,
    category: "legacy",
    description: "Library fillable version of legacy canvas",
  }),
  definePDF({
    id: "lib-life-alignment-assessment-alt",
    title: "Life Alignment Assessment (Library)",
    type: "assessment",
    tier: "free",
    outputPath: "/assets/downloads/lib-pdf/life-alignment-assessment.pdf",
    category: "personal-growth",
    description: "Library version of life alignment assessment",
  }),
  definePDF({
    id: "lib-personal-alignment-fillable",
    title: "Personal Alignment Assessment (Fillable Library)",
    type: "assessment",
    tier: "free",
    outputPath: "/assets/downloads/lib-pdf/personal-alignment-assessment-fillable.pdf",
    isInteractive: true,
    isFillable: true,
    category: "personal-growth",
    description: "Library fillable version of personal alignment",
  }),
  definePDF({
    id: "lib-purpose-pyramid-fillable",
    title: "Purpose Pyramid Worksheet (Fillable Library)",
    type: "worksheet",
    tier: "free",
    outputPath: "/assets/downloads/lib-pdf/purpose-pyramid-worksheet-fillable.pdf",
    isInteractive: true,
    isFillable: true,
    category: "personal-growth",
    description: "Library fillable version of purpose pyramid",
  }),
  definePDF({
    id: "lib-ultimate-purpose-editorial-alt",
    title: "Ultimate Purpose of Man (Editorial Library)",
    type: "editorial",
    tier: "free",
    outputPath: "/assets/downloads/lib-pdf/ultimate-purpose-of-man-editorial.pdf",
    category: "theology",
    description: "Library version of ultimate purpose editorial",
  }),

  // --- PUBLIC ASSETS RESOURCES DIRECTORY ---
  definePDF({
    id: "res-brotherhood-starter-kit",
    title: "Brotherhood Starter Kit (Resources)",
    type: "toolkit",
    tier: "free",
    outputPath: "/assets/downloads/public-assets/resources/pdfs/brotherhood-starter-kit.pdf",
    category: "leadership",
    description: "Resources version of brotherhood starter kit",
  }),
  definePDF({
    id: "res-destiny-mapping",
    title: "Destiny Mapping Worksheet",
    type: "worksheet",
    tier: "free",
    outputPath: "/assets/downloads/public-assets/resources/pdfs/destiny-mapping-worksheet.pdf",
    category: "strategic",
    description: "Destiny mapping worksheet for strategic planning",
  }),
  definePDF({
    id: "res-fatherhood-impact",
    title: "Fatherhood Impact Framework",
    type: "framework",
    tier: "free",
    outputPath: "/assets/downloads/public-assets/resources/pdfs/fatherhood-impact-framework.pdf",
    category: "family",
    description: "Framework for fatherhood impact and legacy",
  }),
  definePDF({
    id: "res-institutional-health",
    title: "Institutional Health Scorecard",
    type: "assessment",
    tier: "architect",
    outputPath: "/assets/downloads/public-assets/resources/pdfs/institutional-health-scorecard.pdf",
    category: "governance",
    description: "Scorecard for institutional health assessment",
  }),
  definePDF({
    id: "res-leadership-blueprint",
    title: "Leadership Standards Blueprint",
    type: "blueprint",
    tier: "architect",
    outputPath: "/assets/downloads/public-assets/resources/pdfs/leadership-standards-blueprint.pdf",
    category: "leadership",
    description: "Blueprint for leadership standards development",
  }),

  // --- VAULT SYNC DIRECTORY ---
  definePDF({
    id: "vault-board-decision-log",
    title: "Board Decision Log (Vault)",
    type: "tool",
    tier: "architect",
    outputPath: "/assets/downloads/public-assets/vault/board-decision-log-template.pdf",
    category: "governance",
    description: "Vault version of board decision log",
  }),
  definePDF({
    id: "vault-decision-log",
    title: "Decision Log Template (Vault)",
    type: "tool",
    tier: "architect",
    outputPath: "/assets/downloads/public-assets/vault/decision-log-template.pdf",
    category: "operations",
    description: "Vault version of decision log template",
  }),
  definePDF({
    id: "vault-decision-matrix-fillable",
    title: "Decision Matrix Scorecard (Vault Fillable)",
    type: "tool",
    tier: "architect",
    outputPath: "/assets/downloads/public-assets/vault/decision-matrix-scorecard-fillable.pdf",
    isFillable: true,
    category: "operations",
    description: "Vault fillable version of decision matrix",
  }),
  definePDF({
    id: "vault-legacy-canvas-fillable",
    title: "Legacy Canvas (Vault Fillable)",
    type: "canvas",
    tier: "architect",
    outputPath: "/assets/downloads/public-assets/vault/legacy-canvas-fillable.pdf",
    isFillable: true,
    category: "legacy",
    description: "Vault fillable version of legacy canvas",
  }),
  definePDF({
    id: "vault-operating-cadence",
    title: "Operating Cadence Pack (Vault)",
    type: "pack",
    tier: "architect",
    outputPath: "/assets/downloads/public-assets/vault/operating-cadence-pack.pdf",
    category: "operations",
    description: "Vault version of operating cadence pack",
  }),
  definePDF({
    id: "vault-personal-alignment-fillable",
    title: "Personal Alignment Assessment (Vault Fillable)",
    type: "assessment",
    tier: "architect",
    outputPath: "/assets/downloads/public-assets/vault/personal-alignment-assessment-fillable.pdf",
    isFillable: true,
    category: "personal-growth",
    description: "Vault fillable version of personal alignment",
  }),
  definePDF({
    id: "vault-purpose-pyramid-fillable",
    title: "Purpose Pyramid Worksheet (Vault Fillable)",
    type: "worksheet",
    tier: "architect",
    outputPath: "/assets/downloads/public-assets/vault/purpose-pyramid-worksheet-fillable.pdf",
    isFillable: true,
    category: "personal-growth",
    description: "Vault fillable version of purpose pyramid",
  }),

  // --- DIRECT VAULT DIRECTORY ---
  definePDF({
    id: "vault-lib-brotherhood-leader",
    title: "Brotherhood Leader Guide (Vault Library)",
    type: "toolkit",
    tier: "inner-circle",
    outputPath: "/vault/downloads/lib-pdf/brotherhood-leader-guide.pdf",
    requiresAuth: true,
    category: "leadership",
    description: "Vault library version of brotherhood leader guide",
  }),
  definePDF({
    id: "vault-lib-brotherhood-starter",
    title: "Brotherhood Starter Kit (Vault Library)",
    type: "toolkit",
    tier: "inner-circle",
    outputPath: "/vault/downloads/lib-pdf/brotherhood-starter-kit.pdf",
    requiresAuth: true,
    category: "leadership",
    description: "Vault library version of brotherhood starter kit",
  }),
  definePDF({
    id: "vault-lib-family-court-pack",
    title: "Family Court Practical Pack (Vault Library)",
    type: "bundle",
    tier: "inner-circle",
    outputPath: "/vault/downloads/lib-pdf/fathers-family-court-pack.pdf",
    requiresAuth: true,
    category: "family-court",
    description: "Vault library version of family court pack",
  })
];

export const ALL_SOURCE_PDFS: SourcePDFItem[] = [...EXISTING_PDFS];

export const getPDFRegistrySource = (): SourcePDFItem[] => {
  return ALL_SOURCE_PDFS;
};