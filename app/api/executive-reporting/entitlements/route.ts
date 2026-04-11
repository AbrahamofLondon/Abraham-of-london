// app/api/executive-reporting/entitlements/route.ts
import { NextResponse } from "next/server";
import { getExecutiveReportingEntitlements } from "@/lib/server/billing/executive-reporting-entitlements";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Email is required." },
        { status: 400 },
      );
    }

    const entitlements = await getExecutiveReportingEntitlements(email);

    return NextResponse.json({
      ok: true,
      entitlements,
    });
  } catch (error) {
    console.error("[EXECUTIVE_REPORTING_ENTITLEMENTS_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load entitlements." },
      { status: 500 },
    );
  }
}