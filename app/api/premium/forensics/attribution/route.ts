// app/api/premium/forensics/attribution/route.ts
import { NextResponse } from "next/server";
import { attributeSuspiciousPdf } from "@/lib/premium/forensics/pdf-attribution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let filename: string | null = null;
    let expectedContentId: string | null = null;
    let suspectedTokenId: string | null = null;
    let expectedFooter: string | null = null;
    let buffer: Buffer | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();

      const file = form.get("file");
      expectedContentId = String(form.get("expectedContentId") || "").trim() || null;
      suspectedTokenId = String(form.get("suspectedTokenId") || "").trim() || null;
      expectedFooter = String(form.get("expectedFooter") || "").trim() || null;

      if (!(file instanceof File)) {
        return NextResponse.json(
          { ok: false, error: "Missing file field in multipart upload" },
          { status: 400 },
        );
      }

      filename = file.name || null;
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      const body = (await req.json().catch(() => null)) as
        | {
            filename?: string;
            pdfBase64?: string;
            expectedContentId?: string;
            suspectedTokenId?: string;
            expectedFooter?: string;
          }
        | null;

      if (!body?.pdfBase64) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Expected multipart/form-data with file, or JSON with pdfBase64",
          },
          { status: 400 },
        );
      }

      filename = body.filename?.trim() || null;
      expectedContentId = body.expectedContentId?.trim() || null;
      suspectedTokenId = body.suspectedTokenId?.trim() || null;
      expectedFooter = body.expectedFooter?.trim() || null;

      const cleaned = body.pdfBase64
        .replace(/^data:application\/pdf;base64,/, "")
        .trim();

      buffer = Buffer.from(cleaned, "base64");
    }

    if (!buffer || !buffer.length) {
      return NextResponse.json(
        { ok: false, error: "Empty PDF payload" },
        { status: 400 },
      );
    }

    const result = await attributeSuspiciousPdf(buffer, {
      filename,
      expectedContentId,
      suspectedTokenId,
      expectedFooter,
    });

    return NextResponse.json(
      {
        ok: true,
        attributed: result.attributed,
        confidence: result.confidence,
        summary: result.summary,
        extracted: result.extracted,
        bestMatch: result.bestMatch,
        candidates: result.candidates,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[PDF_ATTRIBUTION_ROUTE_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to attribute suspicious PDF" },
      { status: 500 },
    );
  }
}