// MOVED: this route is now served by
// /.netlify/functions/purpose-alignment-report-id?assessmentId=<id>
//
// The rewrite was required to pull @react-pdf/renderer +
// AlignmentReportDocument + the Prisma repository chain out of the
// main `___netlify-server-handler` bundle, which exceeds Netlify's
// per-file function upload limit.
//
// Keeping this stub to prevent 404 during transition.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ assessmentId: string }> },
) {
  const { assessmentId } = await params;
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
  return NextResponse.redirect(
    new URL(
      `/.netlify/functions/purpose-alignment-report-id?assessmentId=${encodeURIComponent(
        assessmentId,
      )}`,
      base,
    ),
    308,
  );
}
