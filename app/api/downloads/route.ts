// app/api/downloads/route.ts
import { NextResponse } from "next/server";
import { getDownloads } from "@/lib/downloads";

export const dynamic = "force-dynamic"; // always reflect current disk

export async function GET() {
  const items = getDownloads();
  return NextResponse.json(
    { ok: true, count: items.length, items },
    { headers: { "Cache-Control": "no-store" } },
  );
}
