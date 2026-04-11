export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: false, error: "Database required" }, { status: 503 });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ ok: false, error: "Database required" }, { status: 503 });
}
