// lib/premium/watermark.ts
import crypto from "crypto";
import { rgb, degrees, PDFDocument } from "pdf-lib";
import type { FingerprintProfile } from "@/lib/premium/fingerprint-profile";

export type WatermarkOptions = {
  contentId: string;
  tokenId?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  tier?: string | null;
  briefTitle?: string | null;
  footerText?: string | null;
  watermarkId?: string | null;
  fingerprint?: FingerprintProfile | null;
  issuedAt?: Date | string | null;
  expiresAt?: Date | string | null;
};

export type WatermarkRenderOptions = {
  opacity?: number;
  rotation?: number;
  fontSize?: number;
  position?: "header" | "footer" | "diagonal" | "all";
  color?: [number, number, number];
};

export type WatermarkPayload = {
  watermarkId: string;
  footerText: string;
  tokenLine: string;
  publicMarker: string;
  compactMarker: string;
  forensicHash: string;
  render: Required<WatermarkRenderOptions>;
  metadata: {
    issuedAt: string;
    expiresAt: string | null;
    classification: string | null;
    contentId: string;
    tokenId: string | null;
    userId: string | null;
    sessionId: string | null;
    fingerprintId: string | null;
  };
};

type PdfLibPageLike = {
  drawText: (
    text: string,
    options: {
      x: number;
      y: number;
      size?: number;
      color?: ReturnType<typeof rgb>;
      opacity?: number;
      rotate?: ReturnType<typeof degrees>;
    },
  ) => void;
  getSize: () => { width: number; height: number };
};

type PdfLibDocLike = {
  setTitle?: (value: string) => void;
  setSubject?: (value: string) => void;
  setProducer?: (value: string) => void;
  setCreator?: (value: string) => void;
  setKeywords?: (value: string[]) => void;
  getPages?: () => PdfLibPageLike[];
};

const DEFAULT_RENDER_OPTIONS: Required<WatermarkRenderOptions> = {
  opacity: 0.12,
  rotation: 35,
  fontSize: 8,
  position: "all",
  color: [0.74, 0.64, 0.28],
};

function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeTier(value: unknown): string | null {
  const v = normalizeString(value);
  return v ? v.toUpperCase() : null;
}

function toIsoUtc(date: Date | string | null | undefined): string {
  if (!date) return new Date().toISOString();
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function shortId(value: string | null, max = 12): string | null {
  if (!value) return null;
  return value.length > max ? value.slice(0, max) : value;
}

function stableJson(value: Record<string, unknown>): string {
  const keys = Object.keys(value).sort();
  const ordered: Record<string, unknown> = {};
  for (const key of keys) ordered[key] = value[key];
  return JSON.stringify(ordered);
}

function generateForensicHash(input: Record<string, unknown>): string {
  return crypto
    .createHash("sha256")
    .update(stableJson(input))
    .digest("hex")
    .slice(0, 20);
}

function buildWatermarkIdInternal(input: {
  contentId: string;
  tokenId?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  tier?: string | null;
}): string {
  const digest = crypto
    .createHash("sha256")
    .update(
      [
        input.contentId,
        input.tokenId ?? "",
        input.userId ?? "",
        input.sessionId ?? "",
        input.tier ?? "",
      ].join("|"),
    )
    .digest("hex")
    .slice(0, 16);

  return `wm_${digest}`;
}

function buildClassification(tier: string | null): string {
  if (!tier) return "RESTRICTED";
  if (tier === "PUBLIC" || tier === "FREE") return "CONTROLLED";
  if (tier === "MEMBER") return "MEMBER";
  if (tier === "ARCHITECT") return "CONFIDENTIAL";
  if (tier === "INNER-CIRCLE" || tier === "INNER_CIRCLE") {
    return "STRICTLY CONFIDENTIAL";
  }
  return tier;
}

function buildTokenLine(input: {
  title: string | null;
  contentId: string;
  tokenId: string | null;
  userId: string | null;
  sessionId: string | null;
  tier: string | null;
  watermarkId: string;
  fingerprintId: string | null;
}): string {
  return [
    input.title ? `TITLE ${input.title}` : null,
    `CONTENT ${input.contentId}`,
    input.tokenId ? `TOKEN ${shortId(input.tokenId, 12)}` : null,
    input.userId ? `USER ${shortId(input.userId, 10)}` : null,
    input.sessionId ? `SESSION ${shortId(input.sessionId, 10)}` : null,
    input.tier ? `CLASS ${buildClassification(input.tier)}` : null,
    `WM ${input.watermarkId}`,
    input.fingerprintId ? `FP ${shortId(input.fingerprintId, 12)}` : null,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" | ");
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function normalizeRenderOptions(
  input?: Partial<WatermarkRenderOptions>,
): Required<WatermarkRenderOptions> {
  const merged = {
    ...DEFAULT_RENDER_OPTIONS,
    ...(input ?? {}),
  };

  return {
    opacity: clamp01(merged.opacity),
    rotation:
      typeof merged.rotation === "number" && Number.isFinite(merged.rotation)
        ? merged.rotation
        : DEFAULT_RENDER_OPTIONS.rotation,
    fontSize:
      typeof merged.fontSize === "number" &&
      Number.isFinite(merged.fontSize) &&
      merged.fontSize > 0
        ? merged.fontSize
        : DEFAULT_RENDER_OPTIONS.fontSize,
    position:
      merged.position === "header" ||
      merged.position === "footer" ||
      merged.position === "diagonal" ||
      merged.position === "all"
        ? merged.position
        : DEFAULT_RENDER_OPTIONS.position,
    color:
      Array.isArray(merged.color) && merged.color.length === 3
        ? [
            clamp01(merged.color[0]),
            clamp01(merged.color[1]),
            clamp01(merged.color[2]),
          ]
        : DEFAULT_RENDER_OPTIONS.color,
  };
}

function cleanKeyword(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildKeywords(payload: WatermarkPayload): string[] {
  return [
    "premium",
    "institutional",
    "protected",
    cleanKeyword(payload.metadata.contentId),
    cleanKeyword(payload.watermarkId),
    cleanKeyword(payload.metadata.classification),
    cleanKeyword(payload.metadata.tokenId),
    cleanKeyword(payload.metadata.fingerprintId),
  ].filter((value): value is string => Boolean(value));
}

export function createWatermarkPayload(
  options: WatermarkOptions,
  renderOptions?: Partial<WatermarkRenderOptions>,
): WatermarkPayload {
  const contentId = normalizeString(options.contentId) || "unknown-content";
  const tokenId = normalizeString(options.tokenId);
  const userId = normalizeString(options.userId);
  const sessionId = normalizeString(options.sessionId);
  const tier = normalizeTier(options.tier);
  const title = normalizeString(options.briefTitle);
  const fingerprintId = normalizeString(options.fingerprint?.profileId);
  const issuedAt = toIsoUtc(options.issuedAt);
  const expiresAt = options.expiresAt ? toIsoUtc(options.expiresAt) : null;

  const watermarkId =
    normalizeString(options.watermarkId) ||
    buildWatermarkIdInternal({
      contentId,
      tokenId,
      userId,
      sessionId,
      tier,
    });

  const tokenLine = buildTokenLine({
    title,
    contentId,
    tokenId,
    userId,
    sessionId,
    tier,
    watermarkId,
    fingerprintId,
  });

  const footerText =
    normalizeString(options.footerText) ||
    `ABRAHAM OF LONDON • INSTITUTIONAL COPY • ${tokenLine}`;

  const compactMarker = [
    shortId(watermarkId, 10),
    shortId(tokenId, 8),
    shortId(contentId, 10),
    shortId(tier, 8),
  ]
    .filter((value): value is string => Boolean(value))
    .join("·");

  const forensicHash = generateForensicHash({
    watermarkId,
    contentId,
    tokenId,
    userId,
    sessionId,
    tier,
    fingerprintId,
    issuedAt,
    expiresAt,
  });

  return {
    watermarkId,
    footerText,
    tokenLine,
    publicMarker: `AOL:${watermarkId}`,
    compactMarker,
    forensicHash,
    render: normalizeRenderOptions(renderOptions),
    metadata: {
      issuedAt,
      expiresAt,
      classification: buildClassification(tier),
      contentId,
      tokenId,
      userId,
      sessionId,
      fingerprintId,
    },
  };
}

export function getWatermarkFooterText(options: WatermarkOptions): string {
  return createWatermarkPayload(options).footerText;
}

export function getWatermarkId(options: WatermarkOptions): string {
  return createWatermarkPayload(options).watermarkId;
}

export function verifyWatermarkIntegrity(
  payload: WatermarkPayload,
  options: WatermarkOptions,
): boolean {
  const expectedHash = generateForensicHash({
    watermarkId: payload.watermarkId,
    contentId: normalizeString(options.contentId) || "unknown-content",
    tokenId: normalizeString(options.tokenId),
    userId: normalizeString(options.userId),
    sessionId: normalizeString(options.sessionId),
    tier: normalizeTier(options.tier),
    fingerprintId: normalizeString(options.fingerprint?.profileId),
    issuedAt: payload.metadata.issuedAt,
    expiresAt: payload.metadata.expiresAt,
  });

  return expectedHash === payload.forensicHash;
}

function drawFooter(page: PdfLibPageLike, payload: WatermarkPayload): void {
  const { width } = page.getSize();

  page.drawText(payload.footerText.slice(0, 150), {
    x: 36,
    y: 18,
    size: payload.render.fontSize,
    color: rgb(...payload.render.color),
    opacity: payload.render.opacity,
  });

  page.drawText(payload.compactMarker, {
    x: Math.max(36, width - 150),
    y: 30,
    size: 6,
    color: rgb(0.45, 0.45, 0.45),
    opacity: 0.12,
  });
}

function drawHeader(page: PdfLibPageLike, payload: WatermarkPayload): void {
  const { width, height } = page.getSize();

  page.drawText(payload.publicMarker, {
    x: Math.max(36, width - 130),
    y: height - 20,
    size: 6.5,
    color: rgb(0.45, 0.45, 0.45),
    opacity: 0.12,
  });
}

function drawDiagonal(page: PdfLibPageLike, payload: WatermarkPayload): void {
  const { width, height } = page.getSize();

  page.drawText(payload.publicMarker, {
    x: width * 0.22,
    y: height * 0.48,
    size: payload.render.fontSize * 2.2,
    color: rgb(...payload.render.color),
    opacity: Math.min(payload.render.opacity * 0.7, 0.09),
    rotate: degrees(payload.render.rotation),
  });
}

export function applyPdfLibWatermark(
  pdfDoc: PdfLibDocLike,
  options: WatermarkOptions,
  renderOptions?: Partial<WatermarkRenderOptions>,
): WatermarkPayload {
  const payload = createWatermarkPayload(options, renderOptions);

  try {
    if (typeof pdfDoc.setTitle === "function") {
      pdfDoc.setTitle(
        `${options.briefTitle || options.contentId} | Abraham of London`,
      );
    }

    if (typeof pdfDoc.setSubject === "function") {
      pdfDoc.setSubject(payload.footerText);
    }

    if (typeof pdfDoc.setProducer === "function") {
      pdfDoc.setProducer("Abraham of London Institutional Pipeline v3.0");
    }

    if (typeof pdfDoc.setCreator === "function") {
      pdfDoc.setCreator("Abraham of London Security Layer");
    }

    if (typeof pdfDoc.setKeywords === "function") {
      pdfDoc.setKeywords(buildKeywords(payload));
    }

    if (typeof pdfDoc.getPages === "function") {
      const pages = pdfDoc.getPages();

      pages.forEach((page, index) => {
        const isFirstPage = index === 0;
        const isLastPage = index === pages.length - 1;

        if (
          payload.render.position === "footer" ||
          payload.render.position === "all"
        ) {
          drawFooter(page, payload);
        }

        if (
          payload.render.position === "header" ||
          payload.render.position === "all"
        ) {
          drawHeader(page, payload);
        }

        if (
          (payload.render.position === "diagonal" ||
            payload.render.position === "all") &&
          isFirstPage
        ) {
          drawDiagonal(page, payload);
        }

        if (isLastPage && payload.metadata.userId) {
          const { width } = page.getSize();
          const issuedLine = `Issued to ${shortId(
            payload.metadata.userId,
            12,
          )} • ${payload.metadata.issuedAt.slice(0, 19)}Z`;

          page.drawText(issuedLine, {
            x: Math.max(36, width - 220),
            y: 10,
            size: 5.5,
            color: rgb(0.4, 0.4, 0.4),
            opacity: 0.2,
          });
        }
      });
    }
  } catch (error) {
    console.debug("[WATERMARK] Non-critical rendering error:", error);
  }

  return payload;
}

export async function watermarkPdfBuffer(
  input: Buffer,
  options: WatermarkOptions,
  renderOptions?: Partial<WatermarkRenderOptions>,
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(input);
  applyPdfLibWatermark(pdfDoc, options, renderOptions);
  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

export default {
  createWatermarkPayload,
  getWatermarkFooterText,
  getWatermarkId,
  verifyWatermarkIntegrity,
  applyPdfLibWatermark,
  watermarkPdfBuffer,
};