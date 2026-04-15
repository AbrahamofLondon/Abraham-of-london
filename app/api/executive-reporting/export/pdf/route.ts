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
  // 307 preserves method + body so the forwarded POST still has its JSON.
  return new NextResponse(body, {
    status: 307,
    headers: {
      Location: "/.netlify/functions/executive-report-pdf",
      "Content-Type": request.headers.get("Content-Type") || "application/json",
    },
  });
}
