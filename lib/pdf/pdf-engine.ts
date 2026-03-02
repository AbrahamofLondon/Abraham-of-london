// lib/pdf/pdf-engine.ts
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { safeString, safeArray, safeNumber } from "@/lib/utils/safe";

// Minimal, dependency-free timestamp helper.
function nowIso(): string {
  try {
    return new Date().toISOString();
  } catch {
    return "";
  }
}

type InstitutionalReportType = "WEEKLY_INTEL_DIGEST" | "BOARD_MEMO" | "UNKNOWN";

type WeeklyIntelRisk = { title?: string } | string;

type WeeklyIntelDossier = {
  title?: string;
  logic?: string;
  engagementScore?: number;
  criticalRisks?: WeeklyIntelRisk[];
};

type WeeklyIntelDigestPayload = {
  dossiers?: WeeklyIntelDossier[];
};

const THEME = {
  brand: "ABRAHAM OF LONDON",
  headerText: [40, 40, 40] as const,
  subText: [100, 100, 100] as const,
  bodyText: [60, 60, 60] as const,
  accent: [0, 51, 102] as const, // Institutional Blue
  page: {
    format: "a4" as const,
    unit: "mm" as const,
    marginX: 14,
    topY: 18,
    headerY: 22,
    dividerY: 35,
    contentStartY: 45,
    footerY: 285,
    pageWidth: 210,
    pageHeight: 297,
  },
};

function normalizeReportType(x: string): InstitutionalReportType {
  const s = String(x || "").trim().toUpperCase();
  if (s === "WEEKLY_INTEL_DIGEST") return "WEEKLY_INTEL_DIGEST";
  if (s === "BOARD_MEMO") return "BOARD_MEMO";
  return "UNKNOWN";
}

function hasBuffer(): boolean {
  // Edge/browser-safe guard
  return typeof (globalThis as any).Buffer !== "undefined";
}

function asBuffer(bytes: Uint8Array): Buffer {
  // In Node, Buffer exists. In Edge/browser, caller should use generateInstitutionalPDFBytes().
  const B = (globalThis as any).Buffer;
  return B.from(bytes);
}

function drawHeader(doc: jsPDF, reportType: string, timestamp: string) {
  const { marginX, headerY } = THEME.page;

  doc.setFontSize(18);
  doc.setTextColor(...THEME.headerText);
  doc.text(THEME.brand, marginX, headerY);

  doc.setFontSize(10);
  doc.setTextColor(...THEME.subText);
  doc.text(`CLASSIFICATION: INSTITUTIONAL BRIEF | TYPE: ${reportType}`, marginX, headerY + 6);
  doc.text(`GENERATED: ${timestamp}`, marginX, headerY + 11);
  doc.line(marginX, THEME.page.dividerY, THEME.page.pageWidth - marginX, THEME.page.dividerY);
}

function drawFooter(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Abraham of London - Proprietary Intelligence | Page ${i} of ${pageCount}`,
      THEME.page.marginX,
      THEME.page.footerY,
    );
  }
}

function ensureRoomOrPageBreak(doc: jsPDF, yPos: number, minRoom: number) {
  // minRoom is space needed below yPos
  if (yPos + minRoom <= 270) return yPos;
  doc.addPage();
  return THEME.page.topY;
}

function renderWeeklyIntelDigest(doc: jsPDF, payload: WeeklyIntelDigestPayload) {
  let yPos = THEME.page.contentStartY;

  const dossiers = safeArray<WeeklyIntelDossier>(payload?.dossiers);

  dossiers.forEach((dossier, index) => {
    yPos = ensureRoomOrPageBreak(doc, yPos, 40);

    const title = safeString(dossier?.title, 140) || "Untitled Dossier";
    const logic = safeString(dossier?.logic, 2000) || "N/A";
    const engagementScore = safeNumber(dossier?.engagementScore, 0);

    // Title
    doc.setFontSize(14);
    doc.setTextColor(...THEME.accent);
    doc.text(`${index + 1}. ${title}`, THEME.page.marginX, yPos);

    // Logic
    doc.setFontSize(10);
    doc.setTextColor(...THEME.bodyText);
    const logicText = doc.splitTextToSize(`Logic: ${logic}`, 180);
    doc.text(logicText, THEME.page.marginX, yPos + 7);

    yPos += logicText.length * 5 + 12;
    yPos = ensureRoomOrPageBreak(doc, yPos, 35);

    // Risks Table
    const criticalRisks = safeArray<WeeklyIntelRisk>(dossier?.criticalRisks);

    const body =
      criticalRisks.length > 0
        ? criticalRisks.map((risk) => {
            const riskTitle =
              typeof risk === "string"
                ? safeString(risk, 160) || "Unspecified risk"
                : safeString((risk as any)?.title, 160) || "Unspecified risk";
            return [riskTitle, String(engagementScore)];
          })
        : [["None reported", String(engagementScore)]];

    (doc as any).autoTable({
      startY: yPos,
      head: [["Critical Risk Factor", "Engagement Score"]],
      body,
      theme: "striped",
      headStyles: { fillColor: THEME.accent },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: THEME.page.marginX, right: THEME.page.marginX },
    });

    const lastY =
      (doc as any).lastAutoTable?.finalY ??
      yPos + Math.max(20, body.length * 8);

    yPos = lastY + 12;
  });
}

function renderBoardMemo(doc: jsPDF, data: any) {
  // Minimal “board memo” renderer (real output, not a placeholder).
  // If you want more structure later, extend this.
  const y0 = THEME.page.contentStartY;
  doc.setFontSize(12);
  doc.setTextColor(...THEME.bodyText);

  const title = safeString(data?.title, 140) || "Board Memo";
  const summary = safeString(data?.summary, 3000) || safeString(data?.content, 6000) || "N/A";

  doc.setFontSize(14);
  doc.setTextColor(...THEME.accent);
  doc.text(title, THEME.page.marginX, y0);

  doc.setFontSize(10);
  doc.setTextColor(...THEME.bodyText);
  const lines = doc.splitTextToSize(summary, 180);
  doc.text(lines, THEME.page.marginX, y0 + 8);
}

/**
 * Returns PDF bytes (Edge-safe).
 * Prefer this in runtimes where Buffer may not exist.
 */
export async function generateInstitutionalPDFBytes(data: any, reportType: string): Promise<Uint8Array> {
  const doc = new jsPDF({ format: THEME.page.format, unit: THEME.page.unit });

  const safeReportType = normalizeReportType(reportType);
  const timestamp = nowIso();

  drawHeader(doc, safeReportType, timestamp);

  if (safeReportType === "WEEKLY_INTEL_DIGEST") {
    renderWeeklyIntelDigest(doc, data as WeeklyIntelDigestPayload);
  } else if (safeReportType === "BOARD_MEMO") {
    renderBoardMemo(doc, data);
  } else {
    // Not a placeholder file; still a real PDF with an explicit “unsupported” message.
    doc.setFontSize(12);
    doc.setTextColor(...THEME.bodyText);
    const msg = doc.splitTextToSize(`No renderer configured for report type: ${safeReportType}`, 180);
    doc.text(msg, THEME.page.marginX, THEME.page.contentStartY);
  }

  drawFooter(doc);

  const ab = doc.output("arraybuffer") as ArrayBuffer;
  return new Uint8Array(ab);
}

/**
 * Node-friendly wrapper returning Buffer.
 * Do NOT call this in Edge runtime.
 */
export async function generateInstitutionalPDF(data: any, reportType: string): Promise<Buffer> {
  const bytes = await generateInstitutionalPDFBytes(data, reportType);
  if (!hasBuffer()) {
    throw new Error("[pdf-engine] Buffer is not available in this runtime. Use generateInstitutionalPDFBytes().");
  }
  return asBuffer(bytes);
}