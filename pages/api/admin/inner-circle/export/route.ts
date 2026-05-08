import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  void req;
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
