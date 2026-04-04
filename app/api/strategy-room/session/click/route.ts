// app/api/strategy-room/session/click/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type ClickInput = {
  sessionKey: string;
  assetId: string;
  assetTitle?: string;
  assetHref?: string | null;
  assetKind?: string;
  rank?: number;
  matchScore?: number;
  metadataConfidence?: number | null;
  reasons?: string[];
  contextSnapshot?: Record<string, unknown>;
};

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ClickInput;

    const sessionKey = safeString(body?.sessionKey);
    const assetId = safeString(body?.assetId);
    const assetTitle = safeString(body?.assetTitle);
    const assetHref = safeString(body?.assetHref);
    const assetKind = safeString(body?.assetKind);
    const rank = safeNumber(body?.rank, 0);
    const matchScore = safeNumber(body?.matchScore, 0);
    const metadataConfidence =
      body?.metadataConfidence === null || body?.metadataConfidence === undefined
        ? null
        : safeNumber(body.metadataConfidence, 0);

    const reasons = Array.isArray(body?.reasons)
      ? body.reasons.filter((item): item is string => typeof item === "string")
      : [];

    const contextSnapshot =
      body?.contextSnapshot && typeof body.contextSnapshot === "object"
        ? body.contextSnapshot
        : {};

    if (!sessionKey) {
      return NextResponse.json(
        { success: false, error: "sessionKey is required" },
        { status: 400 }
      );
    }

    if (!assetId) {
      return NextResponse.json(
        { success: false, error: "assetId is required" },
        { status: 400 }
      );
    }

    const prisma =
      typeof (db as any)?.getPrismaClient === "function"
        ? await (db as any).getPrismaClient()
        : db;

    if (!prisma) {
      throw new Error("Database unavailable");
    }

    const session = await prisma.decisionRecommendationSession.findUnique({
      where: { sessionKey },
      select: { id: true, sessionKey: true },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "decision session not found" },
        { status: 404 }
      );
    }

    const click = await prisma.decisionRecommendationClick.create({
      data: {
        sessionId: session.id,
        assetId,
        assetTitle: assetTitle || assetId,
        assetHref: assetHref || null,
        assetKind: assetKind || "unknown",
        rank,
        matchScore,
        metadataConfidence,
        reasons,
        contextSnapshot,
      },
    });

    return NextResponse.json({
      success: true,
      clickId: click.id,
      sessionKey: session.sessionKey,
      assetId,
    });
  } catch (error) {
    console.error("[STRATEGY_ROOM_CLICK_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to log recommendation click",
      },
      { status: 500 }
    );
  }
}