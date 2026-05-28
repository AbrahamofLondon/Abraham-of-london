import { NextResponse } from 'next/server';

/**
 * HISTORY RETRIEVAL PROTOCOL:
 * 1. SCOPE: Returns the last 5 committed snapshots.
 * 2. ORDER: Chronological descending (Newest first).
 *
 * Implementation status: STUB — pending production DB wiring.
 * Returns 501 in production until a real data source is connected.
 */

export async function GET() {
  // Not yet wired to a durable store. Return 501 in production so callers
  // know the endpoint is not available rather than receiving fabricated data.
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { ok: false, reason: "NOT_IMPLEMENTED" },
      { status: 501 },
    );
  }

  // Dev-only stub: simulated brief history for local UI development.
  // Status labels in this stub are MOCK to reflect that no real decision occurred.
  const stubHistory = [
    { id: "OGR-A72X", timestamp: new Date().toISOString(), resonance: 94.2, alpha: 12.4, status: "MOCK" },
    { id: "OGR-B91P", timestamp: new Date(Date.now() - 86400000).toISOString(), resonance: 88.5, alpha: 8.2, status: "REALIGN" },
  ];

  return NextResponse.json(stubHistory);
}