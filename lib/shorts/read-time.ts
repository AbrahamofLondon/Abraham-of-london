// lib/shorts/read-time.ts
// Shared read-time estimation for shorts. Single source of truth so the
// daily-short component and the index page agree on word-count + minutes.

const WORDS_PER_MINUTE = 220;

export function computeReadTime(wordCount: number): string {
  const min = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
  return `${min} min read`;
}

// Estimate words from a markdown/HTML-ish string. Strips tags + markdown
// syntax, then counts whitespace-separated tokens.
export function estimateWordCount(text: string): number {
  if (!text) return 0;
  const cleaned = text
    .replace(/<[^>]*>/g, "")
    .replace(/[#*_`\[\]()>|~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.split(/\s+/).filter(Boolean).length;
}

// Convenience: read time straight from raw text.
export function readTimeFromText(text: string): string {
  return computeReadTime(estimateWordCount(text));
}
