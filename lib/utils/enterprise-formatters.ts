import { 
  EnterpriseAlignmentBand, 
  EnterpriseAlignmentDomain, 
  ENTERPRISE_ALIGNMENT_DOMAIN_LABELS 
} from "@/lib/alignment/enterprise-types";

/**
 * Formats canonical uppercase bands into Sentence Case for display.
 */
export function formatEnterpriseBand(band: EnterpriseAlignmentBand | string): string {
  const normalized = band.toUpperCase();
  switch (normalized) {
    case "ALIGNED":
      return "Aligned";
    case "DRIFTING":
      return "Drifting";
    case "MISALIGNED":
      return "Misaligned";
    case "DISORDERED":
      return "Disordered";
    default:
      // Fallback for custom or unknown bands
      return band.charAt(0).toUpperCase() + band.slice(1).toLowerCase();
  }
}

/**
 * Returns the human-readable label for a domain key.
 */
export function formatDomainLabel(domain: EnterpriseAlignmentDomain): string {
  return ENTERPRISE_ALIGNMENT_DOMAIN_LABELS[domain] || domain;
}

/**
 * Returns a CSS color class based on the band for dynamic styling.
 */
export function getBandThemeColor(band: EnterpriseAlignmentBand): string {
  switch (band) {
    case "ALIGNED": return "text-emerald-600";
    case "DRIFTING": return "text-blue-600";
    case "MISALIGNED": return "text-amber-600";
    case "DISORDERED": return "text-rose-600";
    default: return "text-slate-600";
  }
}