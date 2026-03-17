// lib/premium/forensics/pdf-attribution.ts
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type PdfLooseMetadata = {
  title?: string | null;
  author?: string | null;
  subject?: string | null;
  creator?: string | null;
  producer?: string | null;
  creationDate?: string | null;
  modDate?: string | null;
};

export type ExtractedPdfSignals = {
  sha256: string;
  byteLength: number;
  pageCountEstimate: number;
  metadata: PdfLooseMetadata;
  textSample: string;
  normalizedTextSample: string;
  discoveredTokenIds: string[];
  discoveredWatermarkIds: string[];
  footerMatched: boolean;
  footerEvidence?: string | null;
  fingerprint: string;
};

export type TokenAttributionEvidence = {
  tokenIdMatch: boolean;
  watermarkIdMatch: boolean;
  contentIdMatch: boolean;
  footerMatch: boolean;
  fingerprintMatch: boolean;
  metadataSimilarity: number;
  extractedTokenIds: string[];
  extractedWatermarkIds: string[];
  extractedFooterEvidence?: string | null;
  storedWatermarkId?: string | null;
  storedFooter?: string | null;
  storedFingerprint?: string | null;
};

export type AttributionCandidate = {
  tokenId: string;
  contentId: string;
  userId?: string | null;
  sessionId?: string | null;
  expiresAt: Date;
  revokedAt?: Date | null;
  usedCount: number;
  maxDownloads: number;
  metadata?: Record<string, unknown> | null;
  score: number;
  evidence: TokenAttributionEvidence;
};

export type PdfAttributionResult = {
  ok: true;
  attributed: boolean;
  confidence: number;
  summary: string;
  extracted: ExtractedPdfSignals;
  bestMatch?: AttributionCandidate;
  candidates: AttributionCandidate[];
};

export type PdfAttributionOptions = {
  filename?: string | null;
  expectedContentId?: string | null;
  suspectedTokenId?: string | null;
  expectedFooter?: string | null;
  maxCandidates?: number;
};

function toUtf8Safe(buffer: Buffer): string {
  try {
    return buffer.toString("utf8");
  } catch {
    return buffer.toString("latin1");
  }
}

function toLatin1(buffer: Buffer): string {
  return buffer.toString("latin1");
}

function sha256Hex(input: Buffer | string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function normalizeText(input: string): string {
  return String(input || "")
    .replace(/\0/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  const out = new Set<string>();
  for (const value of values) {
    const v = String(value || "").trim();
    if (v) out.add(v);
  }
  return [...out];
}

function safeJsonObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function getString(
  obj: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  const value = obj?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getNestedString(
  obj: Record<string, unknown> | null | undefined,
  path: string[],
): string | null {
  let current: unknown = obj;
  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return null;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" && current.trim() ? current.trim() : null;
}

function safeRegexMatch(text: string, regex: RegExp): string | null {
  const m = regex.exec(text);
  return m?.[1] ? m[1] : null;
}

function decodePdfStringValue(value: string): string {
  return value
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\n/g, " ")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\[0-7]{1,3}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractLooseMetadata(pdfText: string): PdfLooseMetadata {
  const title = safeRegexMatch(pdfText, /\/Title\s*\((.*?)\)/s);
  const author = safeRegexMatch(pdfText, /\/Author\s*\((.*?)\)/s);
  const subject = safeRegexMatch(pdfText, /\/Subject\s*\((.*?)\)/s);
  const creator = safeRegexMatch(pdfText, /\/Creator\s*\((.*?)\)/s);
  const producer = safeRegexMatch(pdfText, /\/Producer\s*\((.*?)\)/s);
  const creationDate = safeRegexMatch(pdfText, /\/CreationDate\s*\((.*?)\)/s);
  const modDate = safeRegexMatch(pdfText, /\/ModDate\s*\((.*?)\)/s);

  return {
    title: title ? decodePdfStringValue(title) : null,
    author: author ? decodePdfStringValue(author) : null,
    subject: subject ? decodePdfStringValue(subject) : null,
    creator: creator ? decodePdfStringValue(creator) : null,
    producer: producer ? decodePdfStringValue(producer) : null,
    creationDate: creationDate ? decodePdfStringValue(creationDate) : null,
    modDate: modDate ? decodePdfStringValue(modDate) : null,
  };
}

function extractVisibleStrings(pdfText: string): string[] {
  const out: string[] = [];

  const parenRegex = /\(([^()]|\\\(|\\\)|\\.){3,300}\)/g;
  let m: RegExpExecArray | null = null;
  while ((m = parenRegex.exec(pdfText))) {
    const raw = m[0].slice(1, -1);
    const cleaned = decodePdfStringValue(raw);
    if (cleaned.length >= 3) out.push(cleaned);
  }

  const tjRegex = /(?:\(([^()]|\\\(|\\\)|\\.){1,300}\)\s*Tj)/g;
  while ((m = tjRegex.exec(pdfText))) {
    const block = m[0];
    const inner = safeRegexMatch(block, /\((.*)\)\s*Tj/s);
    if (inner) {
      const cleaned = decodePdfStringValue(inner);
      if (cleaned.length >= 3) out.push(cleaned);
    }
  }

  return out;
}

function estimatePageCount(pdfText: string): number {
  const matches = pdfText.match(/\/Type\s*\/Page\b/g);
  return matches?.length || 0;
}

function discoverTokenIds(haystack: string): string[] {
  const out = new Set<string>();

  const uuidRegex =
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
  for (const m of haystack.matchAll(uuidRegex)) {
    out.add(m[0]);
  }

  const tokenLabelRegex =
    /\b(?:token(?:[_\s-]?id)?|tid)\s*[:=]\s*([a-z0-9-]{8,64})\b/gi;
  for (const m of haystack.matchAll(tokenLabelRegex)) {
    if (m[1]) out.add(m[1]);
  }

  return [...out];
}

function discoverWatermarkIds(haystack: string): string[] {
  const out = new Set<string>();

  const wmRegex = /\b(?:wm|watermark)(?:[_\s-]?id)?\s*[:=]\s*([a-z0-9_-]{4,120})\b/gi;
  for (const m of haystack.matchAll(wmRegex)) {
    if (m[1]) out.add(m[1]);
  }

  const prefixedRegex = /\bwm_[a-z0-9_-]{4,120}\b/gi;
  for (const m of haystack.matchAll(prefixedRegex)) {
    out.add(m[0]);
  }

  return [...out];
}

function textContainsFooter(
  strings: string[],
  expectedFooter?: string | null,
): { matched: boolean; evidence?: string | null } {
  const footer = normalizeText(expectedFooter || "");
  if (!footer) return { matched: false, evidence: null };

  for (const s of strings) {
    const ns = normalizeText(s);
    if (!ns) continue;
    if (ns.includes(footer) || footer.includes(ns)) {
      return { matched: true, evidence: s };
    }
  }

  return { matched: false, evidence: null };
}

function buildFingerprintFromSignals(input: {
  sha256: string;
  byteLength: number;
  pageCountEstimate: number;
  metadata: PdfLooseMetadata;
  normalizedTextSample: string;
}): string {
  const payload = JSON.stringify({
    sha256Prefix: input.sha256.slice(0, 24),
    sizeBand: Math.round(input.byteLength / 1024),
    pages: input.pageCountEstimate,
    creator: normalizeText(input.metadata.creator || ""),
    producer: normalizeText(input.metadata.producer || ""),
    title: normalizeText(input.metadata.title || ""),
    text: input.normalizedTextSample.slice(0, 1200),
  });

  return sha256Hex(payload).slice(0, 32);
}

export function extractPdfSignals(
  buffer: Buffer,
  options?: { expectedFooter?: string | null },
): ExtractedPdfSignals {
  const pdfText = toLatin1(buffer);
  const utfText = toUtf8Safe(buffer);

  const metadata = extractLooseMetadata(pdfText);
  const visibleStrings = extractVisibleStrings(pdfText);
  const combinedVisible = visibleStrings.join(" | ");
  const normalizedTextSample = normalizeText(combinedVisible || utfText).slice(0, 3000);

  const discoveredTokenIds = uniqueStrings([
    ...discoverTokenIds(pdfText),
    ...discoverTokenIds(utfText),
    ...discoverTokenIds(combinedVisible),
  ]);

  const discoveredWatermarkIds = uniqueStrings([
    ...discoverWatermarkIds(pdfText),
    ...discoverWatermarkIds(utfText),
    ...discoverWatermarkIds(combinedVisible),
  ]);

  const footerCheck = textContainsFooter(visibleStrings, options?.expectedFooter ?? null);

  const sha256 = sha256Hex(buffer);
  const pageCountEstimate = estimatePageCount(pdfText);

  const fingerprint = buildFingerprintFromSignals({
    sha256,
    byteLength: buffer.byteLength,
    pageCountEstimate,
    metadata,
    normalizedTextSample,
  });

  return {
    sha256,
    byteLength: buffer.byteLength,
    pageCountEstimate,
    metadata,
    textSample: combinedVisible.slice(0, 3000),
    normalizedTextSample,
    discoveredTokenIds,
    discoveredWatermarkIds,
    footerMatched: footerCheck.matched,
    footerEvidence: footerCheck.evidence ?? null,
    fingerprint,
  };
}

function scoreMetadataSimilarity(
  extracted: PdfLooseMetadata,
  stored: Record<string, unknown> | null,
): number {
  const storedTitle =
    getNestedString(stored, ["pdf", "title"]) ||
    getNestedString(stored, ["document", "title"]) ||
    getString(stored, "title");

  const storedCreator =
    getNestedString(stored, ["pdf", "creator"]) ||
    getNestedString(stored, ["document", "creator"]) ||
    getString(stored, "creator");

  const storedProducer =
    getNestedString(stored, ["pdf", "producer"]) ||
    getNestedString(stored, ["document", "producer"]) ||
    getString(stored, "producer");

  let score = 0;

  if (
    storedTitle &&
    extracted.title &&
    normalizeText(storedTitle) === normalizeText(extracted.title)
  ) {
    score += 2;
  }

  if (
    storedCreator &&
    extracted.creator &&
    normalizeText(storedCreator) === normalizeText(extracted.creator)
  ) {
    score += 2;
  }

  if (
    storedProducer &&
    extracted.producer &&
    normalizeText(storedProducer) === normalizeText(extracted.producer)
  ) {
    score += 1;
  }

  return score;
}

function scoreCandidate(params: {
  row: {
    tokenId: string;
    contentId: string;
    userId: string | null;
    sessionId: string | null;
    expiresAt: Date;
    revokedAt: Date | null;
    usedCount: number;
    maxDownloads: number;
    metadata: Prisma.JsonValue | null;
  };
  extracted: ExtractedPdfSignals;
  expectedContentId?: string | null;
  suspectedTokenId?: string | null;
  expectedFooter?: string | null;
}): AttributionCandidate {
  const { row, extracted, expectedContentId, suspectedTokenId, expectedFooter } = params;

  const metadata = safeJsonObject(row.metadata);

  const storedWatermarkId =
    getNestedString(metadata, ["forensics", "watermarkId"]) ||
    getNestedString(metadata, ["watermark", "id"]) ||
    getString(metadata, "watermarkId");

  const storedFooter =
    getNestedString(metadata, ["forensics", "expectedFooter"]) ||
    getNestedString(metadata, ["footer", "text"]) ||
    getString(metadata, "expectedFooter") ||
    getString(metadata, "footerText");

  const storedFingerprint =
    getNestedString(metadata, ["forensics", "fingerprint"]) ||
    getNestedString(metadata, ["fingerprint", "profile"]) ||
    getString(metadata, "fingerprint");

  const tokenIdMatch =
    extracted.discoveredTokenIds.includes(row.tokenId) ||
    (!!suspectedTokenId && suspectedTokenId === row.tokenId);

  const watermarkIdMatch =
    !!storedWatermarkId &&
    extracted.discoveredWatermarkIds.some((id) => id === storedWatermarkId);

  const contentIdMatch =
    (!!expectedContentId && row.contentId === expectedContentId) ||
    (!!expectedContentId &&
      extracted.normalizedTextSample.includes(normalizeText(expectedContentId)));

  const footerMatch =
    extracted.footerMatched ||
    (!!storedFooter &&
      extracted.normalizedTextSample.includes(normalizeText(storedFooter))) ||
    (!!expectedFooter &&
      extracted.normalizedTextSample.includes(normalizeText(expectedFooter)));

  const fingerprintMatch = !!storedFingerprint && storedFingerprint === extracted.fingerprint;

  const metadataSimilarity = scoreMetadataSimilarity(extracted.metadata, metadata);

  let score = 0;
  if (tokenIdMatch) score += 55;
  if (watermarkIdMatch) score += 15;
  if (contentIdMatch) score += 10;
  if (footerMatch) score += 10;
  if (fingerprintMatch) score += 15;
  score += metadataSimilarity;

  if (row.revokedAt) score -= 5;
  if (row.expiresAt.getTime() < Date.now()) score -= 3;

  score = Math.max(0, Math.min(100, score));

  return {
    tokenId: row.tokenId,
    contentId: row.contentId,
    userId: row.userId ?? null,
    sessionId: row.sessionId ?? null,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt ?? null,
    usedCount: row.usedCount,
    maxDownloads: row.maxDownloads,
    metadata,
    score,
    evidence: {
      tokenIdMatch,
      watermarkIdMatch,
      contentIdMatch,
      footerMatch,
      fingerprintMatch,
      metadataSimilarity,
      extractedTokenIds: extracted.discoveredTokenIds,
      extractedWatermarkIds: extracted.discoveredWatermarkIds,
      extractedFooterEvidence: extracted.footerEvidence ?? null,
      storedWatermarkId: storedWatermarkId ?? null,
      storedFooter: storedFooter ?? null,
      storedFingerprint: storedFingerprint ?? null,
    },
  };
}

function buildSummary(best?: AttributionCandidate): string {
  if (!best) return "No candidate token record matched the suspicious PDF.";
  if (best.score >= 80) return "High-confidence attribution match.";
  if (best.score >= 60) return "Moderate-confidence attribution match.";
  if (best.score >= 40) return "Weak attribution signal found, but not decisive.";
  return "No reliable attribution could be established.";
}

export async function attributeSuspiciousPdf(
  buffer: Buffer,
  options?: PdfAttributionOptions,
): Promise<PdfAttributionResult> {
  const extracted = extractPdfSignals(buffer, {
    expectedFooter: options?.expectedFooter ?? null,
  });

  const tokenIds = uniqueStrings([
    options?.suspectedTokenId ?? null,
    ...extracted.discoveredTokenIds,
  ]);

  const maxCandidates = Math.max(5, Math.min(Number(options?.maxCandidates || 25), 100));

  const where: Prisma.PremiumDownloadTokenWhereInput = {
    OR: [
      tokenIds.length ? { tokenId: { in: tokenIds } } : undefined,
      options?.expectedContentId ? { contentId: options.expectedContentId } : undefined,
    ].filter(Boolean) as Prisma.PremiumDownloadTokenWhereInput[],
  };

  let rows: Array<{
    tokenId: string;
    contentId: string;
    userId: string | null;
    sessionId: string | null;
    expiresAt: Date;
    revokedAt: Date | null;
    usedCount: number;
    maxDownloads: number;
    metadata: Prisma.JsonValue | null;
  }> = [];

  if (where.OR && where.OR.length > 0) {
    rows = await prisma.premiumDownloadToken.findMany({
      where,
      select: {
        tokenId: true,
        contentId: true,
        userId: true,
        sessionId: true,
        expiresAt: true,
        revokedAt: true,
        usedCount: true,
        maxDownloads: true,
        metadata: true,
      },
      orderBy: [{ issuedAt: "desc" }],
      take: maxCandidates,
    });
  } else if (options?.expectedContentId) {
    rows = await prisma.premiumDownloadToken.findMany({
      where: { contentId: options.expectedContentId },
      select: {
        tokenId: true,
        contentId: true,
        userId: true,
        sessionId: true,
        expiresAt: true,
        revokedAt: true,
        usedCount: true,
        maxDownloads: true,
        metadata: true,
      },
      orderBy: [{ issuedAt: "desc" }],
      take: maxCandidates,
    });
  }

  const candidates = rows
    .map((row) =>
      scoreCandidate({
        row,
        extracted,
        expectedContentId: options?.expectedContentId ?? null,
        suspectedTokenId: options?.suspectedTokenId ?? null,
        expectedFooter: options?.expectedFooter ?? null,
      }),
    )
    .sort((a, b) => b.score - a.score);

  const bestMatch = candidates[0];
  const confidence = bestMatch?.score ?? 0;

  return {
    ok: true,
    attributed: confidence >= 60,
    confidence,
    summary: buildSummary(bestMatch),
    extracted,
    bestMatch,
    candidates,
  };
}

export function buildForensicsMetadata(input: {
  watermarkId?: string | null;
  expectedFooter?: string | null;
  fingerprint?: string | null;
  title?: string | null;
  creator?: string | null;
  producer?: string | null;
}): Record<string, unknown> {
  return {
    forensics: {
      watermarkId: input.watermarkId ?? null,
      expectedFooter: input.expectedFooter ?? null,
      fingerprint: input.fingerprint ?? null,
    },
    pdf: {
      title: input.title ?? null,
      creator: input.creator ?? null,
      producer: input.producer ?? null,
    },
  };
}