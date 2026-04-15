// MOVED: this route is now served by
// /.netlify/functions/purpose-alignment-report
//
// The rewrite was required to pull @react-pdf/renderer +
// AlignmentReportDocument out of the main `___netlify-server-handler`
// bundle, which exceeds Netlify's per-file function upload limit.
//
// Keeping this stub to prevent 404 during transition.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.redirect(
    new URL(
      "/.netlify/functions/purpose-alignment-report",
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org",
    ),
    308,
  );
}
