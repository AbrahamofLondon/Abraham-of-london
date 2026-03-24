import { NextResponse } from 'next/server';

/**
 * HISTORY RETRIEVAL PROTOCOL:
 * 1. SCOPE: Returns the last 5 committed snapshots.
 * 2. ORDER: Chronological descending (Newest first).
 */

export async function GET() {
  // In production, fetch from DB. For now, we simulate the 'Sovereign Brief' storage.
  const mockHistory = [
    { id: "OGR-A72X", timestamp: new Date().toISOString(), resonance: 94.2, alpha: 12.4, status: "APPROVED" },
    { id: "OGR-B91P", timestamp: new Date(Date.now() - 86400000).toISOString(), resonance: 88.5, alpha: 8.2, status: "REALIGN" },
  ];

  return NextResponse.json(mockHistory);
}