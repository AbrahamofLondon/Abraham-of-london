// services/pdf-service.ts
import type {
  PDFItem,
  GenerationResponse,
  ServiceResponse,
  SearchResult,
  ExportOptions,
  BatchOperation,
  PDFListResponse,
  DashboardStats,
  Pagination,
} from "@/types/pdf-dashboard";

/** ---------------------------
 * Internal helpers
 * -------------------------- */
type AnyRecord = Record<string, any>;

function isObject(v: unknown): v is AnyRecord {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function asBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function isoNow(): string {
  return new Date().toISOString();
}

async function readJsonSafe(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function errorMessageFrom(res: Response, body: any): string {
  const generic = `HTTP ${res.status}`;
  if (!body) return generic;
  if (typeof body === "string" && body.trim()) return body;
  if (isObject(body)) {
    if (typeof body.error === "string" && body.error.trim()) return body.error;
    if (typeof body.message === "string" && body.message.trim()) return body.message;
  }
  return generic;
}

async function fetchJsonOrThrow(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });

  const body = await readJsonSafe(res);

  if (!res.ok) {
    const msg = errorMessageFrom(res, body);
    if (res.status === 401 || res.status === 403) throw new Error(`AUTH ${res.status}: ${msg}`);
    throw new Error(msg);
  }

  return body;
}

/** ---------------------------
 * Normalizers aligned to /api/pdfs/list.ts output
 * -------------------------- */

/**
 * /api/pdfs/list.ts maps:
 *  - id, title, description, category, type (string), exists (boolean)
 *  - isGenerating, error, fileUrl, fileSize, lastGenerated
 *  - createdAt, updatedAt, tags, status, metadata, outputPath, downloadCount
 */
function normalizeDashboardPDFItem(raw: any): PDFItem {
  const id = asString(raw?.id, "");
  const title = asString(raw?.title, id || "Untitled");

  const description =
    typeof raw?.description === "string"
      ? raw.description
      : typeof raw?.excerpt === "string"
      ? raw.excerpt
      : undefined;

  const category = typeof raw?.category === "string" ? raw.category : undefined;

  // IMPORTANT: API currently sends type as string (often "pdf").
  // Dashboard PDFItem allows this (do NOT force Canon union here).
  const type = asString(raw?.type, "pdf");

  const exists = asBool(raw?.exists, false);

  const isGenerating = typeof raw?.isGenerating === "boolean" ? raw.isGenerating : undefined;
  const error = typeof raw?.error === "string" ? raw.error : undefined;

  const fileUrl = typeof raw?.fileUrl === "string" ? raw.fileUrl : undefined;
  const fileSize = typeof raw?.fileSize === "string" ? raw.fileSize : undefined;

  const lastGenerated = typeof raw?.lastGenerated === "string" ? raw.lastGenerated : undefined;

  const createdAt = typeof raw?.createdAt === "string" ? raw.createdAt : undefined;
  const updatedAt = typeof raw?.updatedAt === "string" ? raw.updatedAt : undefined;

  const tags = Array.isArray(raw?.tags) ? raw.tags.map(String) : [];

  const status = typeof raw?.status === "string" ? raw.status : undefined;

  const metadata = isObject(raw?.metadata) ? (raw.metadata as AnyRecord) : {};

  const outputPath = typeof raw?.outputPath === "string" ? raw.outputPath : "";

  const downloadCount = Number.isFinite(Number(raw?.downloadCount)) ? Number(raw.downloadCount) : 0;

  // Return as Dashboard PDFItem (not Canon)
  return {
    id,
    title,
    description,
    category,
    type: type as any, // keep flexible; aligns to API
    exists,

    isGenerating,
    error,

    fileUrl,
    fileSize,
    lastGenerated,

    createdAt,
    updatedAt,

    tags,

    status,
    metadata,
    outputPath,

    downloadCount,
  } as PDFItem;
}

function normalizePagination(raw: any, fallbackPage: number, fallbackLimit: number, fallbackTotal: number): Pagination {
  const page = asNumber(raw?.page, fallbackPage);
  const limit = asNumber(raw?.limit, fallbackLimit);
  const total = asNumber(raw?.total, fallbackTotal);
  const totalPages = asNumber(raw?.totalPages, Math.max(1, Math.ceil(total / Math.max(1, limit))));
  return { page, limit, total, totalPages };
}

function buildStatsFrom(pdfs: PDFItem[]): DashboardStats {
  const categories = Array.from(new Set(pdfs.map((p) => p.category).filter((c): c is string => !!c)));

  const generated = pdfs.filter((p) => p.exists && !p.error).length;
  const errors = pdfs.filter((p) => !!p.error).length;
  const generating = pdfs.filter((p) => !!p.isGenerating).length;
  const missingPDFs = pdfs.filter((p) => !p.exists && !p.error && !p.isGenerating).length;

  return {
    totalPDFs: pdfs.length,
    availablePDFs: generated,
    missingPDFs,
    categories,
    generated,
    errors,
    generating,
    lastUpdated: isoNow(),
  };
}

/** /api/pdfs/list always returns { pdfs, pagination, stats } (even when unauth: emptyResponse) */
function normalizePDFListResponse(raw: any, page: number, limit: number): PDFListResponse {
  const root = isObject(raw) ? raw : {};

  const pdfs = asArray<any>(root.pdfs).map(normalizeDashboardPDFItem).filter((p) => p.id);

  const pagination = normalizePagination(root.pagination, page, limit, pdfs.length);

  const stats: DashboardStats = isObject(root.stats)
    ? (root.stats as DashboardStats)
    : buildStatsFrom(pdfs);

  return {
    pdfs,
    pagination,
    stats,
  };
}

/** ---------------------------
 * Service (aligned to list.ts)
 * -------------------------- */
export class PDFService {
  // READ -------------------------------------------------------

  /** ✅ Hook expects array (prevents “pdfs.map is not a function”) */
  static async getPDFs(page: number = 1, limit: number = 50): Promise<PDFItem[]> {
    const list = await this.getPDFList(page, limit);
    return Array.isArray(list.pdfs) ? list.pdfs : [];
  }

  /** Full response (stats + pagination) */
  static async getPDFList(page: number = 1, limit: number = 50): Promise<PDFListResponse> {
    const data = await fetchJsonOrThrow(`/api/pdfs/list?page=${page}&limit=${limit}`);
    return normalizePDFListResponse(data, page, limit);
  }

  static async getStats(page: number = 1, limit: number = 50): Promise<DashboardStats> {
    const list = await this.getPDFList(page, limit);
    return list.stats;
  }

  static async getCategories(page: number = 1, limit: number = 50): Promise<string[]> {
    const list = await this.getPDFList(page, limit);
    const cats = Array.isArray(list.stats?.categories) ? list.stats.categories : [];
    return ["all", ...cats.filter(Boolean)];
  }

  // OPTIONAL: if you have these endpoints ----------------------

  static async getPDFById(id: string): Promise<PDFItem | null> {
    const res = await fetch(`/api/pdfs/${encodeURIComponent(id)}`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    if (res.status === 404) return null;

    const body = await readJsonSafe(res);
    if (!res.ok) throw new Error(errorMessageFrom(res, body));

    const raw = isObject(body) ? (body.pdf ?? body) : body;
    const pdf = normalizeDashboardPDFItem(raw);
    return pdf.id ? pdf : null;
  }

  static async searchPDFs(query: string): Promise<SearchResult[]> {
    const data = await fetchJsonOrThrow(`/api/pdfs/search?q=${encodeURIComponent(query)}`);
    const results = isObject(data) ? data.results : null;
    return Array.isArray(results) ? (results as SearchResult[]) : [];
  }

  // GENERATION --------------------------------------------------

  static async generatePDF(id: string, options?: any): Promise<GenerationResponse> {
    const data = await fetchJsonOrThrow(`/api/pdfs/${encodeURIComponent(id)}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ options }),
    });

    return (isObject(data) ? data : { success: true, pdfId: id, generatedAt: isoNow() }) as GenerationResponse;
  }

  static async generateAllPDFs(): Promise<GenerationResponse> {
    const data = await fetchJsonOrThrow("/api/pdfs/generate-all", { method: "POST" });
    return (isObject(data) ? data : { success: true, generatedAt: isoNow() }) as GenerationResponse;
  }

  // MUTATIONS ---------------------------------------------------

  static async deletePDF(id: string): Promise<void> {
    await fetchJsonOrThrow(`/api/pdfs/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  static async duplicatePDF(id: string): Promise<PDFItem> {
    const data = await fetchJsonOrThrow(`/api/pdfs/${encodeURIComponent(id)}/duplicate`, { method: "POST" });
    const raw = isObject(data) ? (data.pdf ?? data) : data;
    const pdf = normalizeDashboardPDFItem(raw);
    if (!pdf.id) throw new Error("Duplicate failed: invalid payload");
    return pdf;
  }

  static async renamePDF(id: string, newTitle: string): Promise<void> {
    await fetchJsonOrThrow(`/api/pdfs/${encodeURIComponent(id)}/rename`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
  }

  static async updateMetadata(id: string, metadata: Partial<PDFItem>): Promise<void> {
    await fetchJsonOrThrow(`/api/pdfs/${encodeURIComponent(id)}/metadata`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metadata),
    });
  }

  // BATCH -------------------------------------------------------

  static async batchOperation(operation: BatchOperation): Promise<ServiceResponse> {
    const res = await fetch("/api/pdfs/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "include",
      body: JSON.stringify(operation),
    });

    const body = await readJsonSafe(res);

    if (!res.ok) {
      return {
        success: false,
        error: errorMessageFrom(res, body),
        timestamp: isoNow(),
        statusCode: res.status,
      };
    }

    return (isObject(body) ? body : { success: true, timestamp: isoNow() }) as ServiceResponse;
  }

  static async exportPDF(id: string, options: ExportOptions): Promise<Blob> {
    const res = await fetch(`/api/pdfs/${encodeURIComponent(id)}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(options),
    });

    if (!res.ok) throw new Error(`Export failed: ${res.status} ${res.statusText}`);
    return res.blob();
  }
}

// Convenience named exports (optional)
export const getPDFs = PDFService.getPDFs;
export const getPDFList = PDFService.getPDFList;
export const getPDFById = PDFService.getPDFById;
export const generatePDF = PDFService.generatePDF;
export const generateAllPDFs = PDFService.generateAllPDFs;