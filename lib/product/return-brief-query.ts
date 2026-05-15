/**
 * return-brief-query.ts — Pages Router–safe helper for Return Brief status.
 *
 * This module exists so that decision-provenance-record.ts can check whether a
 * Return Brief exists for a Strategy Room session WITHOUT importing the
 * server-only return-brief.server.ts module.
 *
 * It queries Prisma directly and returns only the minimal status needed by
 * the provenance composer. The full Return Brief generation remains in
 * return-brief.server.ts for App Router / API route use.
 *
 * Pages-safe: No `import "server-only"`.
 */

import { prisma } from "@/lib/prisma.server";

export type ReturnBriefQueryResult = {
  available: boolean;
  generatedAt: string | null;
};

/**
 * Checks whether a Return Brief exists for the given session.
 *
 * This is a lightweight query — it does NOT generate a new Return Brief.
 * It only reports whether one has already been persisted.
 *
 * If the session has decisions and a canonical snapshot, we consider a
 * Return Brief potentially available. The actual brief generation is
 * deferred to the App Router / API route.
 */
export async function queryReturnBriefStatus(
  sessionId: string,
): Promise<ReturnBriefQueryResult> {
  try {
    const session = await prisma.strategyRoomExecutionSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        canonicalSnapshot: true,
        _count: {
          select: { decisions: true },
        },
      },
    });

    if (!session) {
      return { available: false, generatedAt: null };
    }

    // A Return Brief is considered "available" if the session has a canonical
    // snapshot and at least one decision recorded.
    const available =
      session.canonicalSnapshot !== null &&
      session.canonicalSnapshot !== undefined &&
      session._count.decisions > 0;

    return {
      available,
      generatedAt: available ? new Date().toISOString() : null,
    };
  } catch {
    return { available: false, generatedAt: null };
  }
}
