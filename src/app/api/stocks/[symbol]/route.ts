import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { symbol: string } }) {
  const symbol = params?.symbol?.toUpperCase?.() || "UNKNOWN";
  return NextResponse.json({ symbol, price: null, status: "disabled" });
}