// MOVED: this route is now served by
// /.netlify/functions/executive-report-pdf
//
// The rewrite was required to pull @react-pdf/renderer + fontkit +
// pdfkit out of the main `___netlify-server-handler` bundle, which was
// exceeding Netlify's per-file function upload limit.
//
// Keeping this stub to prevent 404 during transition.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const contentType = request.headers.get("Content-Type") || "application/json";
  const target = new URL("/.netlify/functions/executive-report-pdf", request.url);

  try {
    const upstream = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body,
    });

    if (!upstream.ok) {
      throw new Error(`Netlify PDF function returned ${upstream.status}`);
    }

    return new NextResponse(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/pdf",
        "Content-Disposition":
          upstream.headers.get("Content-Disposition") ||
          'attachment; filename="executive-report.pdf"',
        "X-PDF-Export-State": "ready",
      },
    });
  } catch (error) {
    let runKey = "";
    try {
      const parsed = JSON.parse(body);
      runKey = typeof parsed?.runKey === "string" ? parsed.runKey : "";
    } catch {
      runKey = "";
    }

    const reason = error instanceof Error ? error.message : "Unknown PDF export failure";
    console.error("[EXECUTIVE_REPORT_PDF_EXPORT_FALLBACK]", {
      runKey,
      reason,
    });

    return NextResponse.json(
      {
        ok: false,
        state: "pdf_unavailable",
        pdfAvailable: false,
        htmlReportAvailable: true,
        htmlReportUrl: runKey
          ? `/diagnostics/executive-reporting/run?runKey=${encodeURIComponent(runKey)}`
          : "/diagnostics/executive-reporting/run",
        adminFailureReason: reason,
        retryable: true,
      },
      {
        status: 200,
        headers: {
          "X-PDF-Export-State": "unavailable",
          "X-PDF-Export-Failure": reason.slice(0, 160),
        },
      },
    );
  }
}
