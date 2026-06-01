/**
 * lib/product/user-language-extraction.ts
 *
 * Safely extracts user-entered text for quotation in result surfaces.
 * Only returns strings the user actually typed — never generated or result text.
 *
 * Rules:
 * - strings only
 * - trim whitespace
 * - exclude very short fragments under 8 characters
 * - exclude duplicates
 * - limit to configured maximum (default 3)
 * - no generated/result text unless explicitly user-entered
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type ExtractSafeUserLanguageQuotesOptions = {
  limit?: number
  minLength?: number
}

// ─── Main Extraction ─────────────────────────────────────────────────────────

/**
 * Extract safe, user-entered text for quotation display.
 * Filters, deduplicates, and limits the output.
 */
export function extractSafeUserLanguageQuotes(
  candidates: (string | null | undefined)[],
  options: ExtractSafeUserLanguageQuotesOptions = {},
): string[] {
  const { limit = 3, minLength = 8 } = options

  const seen = new Set<string>()
  const result: string[] = []

  for (const candidate of candidates) {
    if (!candidate) continue

    const trimmed = candidate.trim()
    if (trimmed.length < minLength) continue

    // Normalize for dedup comparison
    const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ')
    if (seen.has(normalized)) continue
    seen.add(normalized)

    result.push(trimmed)

    if (result.length >= limit) break
  }

  return result
}

/**
 * Extract safe quotes specifically from Purpose Alignment context answers.
 */
export function extractPurposeAlignmentQuotes(contextAnswers: {
  avoidedDecision: string
  competingObligation: string
  consequence: string
}): string[] {
  return extractSafeUserLanguageQuotes([
    contextAnswers.avoidedDecision,
    contextAnswers.competingObligation,
    contextAnswers.consequence,
  ])
}
