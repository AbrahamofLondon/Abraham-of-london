export const dynamic = "force-dynamic";
// app/api/strategy-room/session/conversion/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type ConversionInput = {
  sessionKey: string;
  conversionType: string;
  conversionValue?: number | null;
  assetId?: string;
  assetTitle?: string;
  assetHref?: string;
  assetKind?: string;
  metadata?: Record<string, unknown>;
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
    const body = (await req.json()) as ConversionInput;

    const sessionKey = safeString(body?.sessionKey);
    const conversionType = safeString(body?.conversionType);

    if (!sessionKey) {
      return NextResponse.json(
        { success: false, error: "sessionKey is required" },
        { status: 400 }
      );
    }

    if (!conversionType) {
      return NextResponse.json(
        { success: false, error: "conversionType is required" },
        { status: 400 }
      );
    }

    const prisma =
      typeof (db as any)?.getPrismaClient === "function"
        ? await (db as any).getPrismaClient()
        : db;

    if (!prisma) throw new Error("Database unavailable");

    const session = await prisma.decisionRecommendationSession.findUnique({
      where: { sessionKey },
      select: {
        id: true,
        sessionKey: true,
        converted: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "decision session not found" },
        { status: 404 }
      );
    }

    const assetId = safeString(body?.assetId);
    const assetTitle = safeString(body?.assetTitle);
    const assetHref = safeString(body?.assetHref);
    const assetKind = safeString(body?.assetKind);

    const existingClick = assetId
      ? await prisma.decisionRecommendationClick.findFirst({
          where: {
            sessionId: session.id,
            assetId,
          },
          orderBy: { createdAt: "desc" },
        })
      : null;

    const finalAssetId = assetId || existingClick?.assetId || null;
    const finalAssetTitle = assetTitle || existingClick?.assetTitle || null;
    const finalAssetHref = assetHref || existingClick?.assetHref || null;
    const finalAssetKind = assetKind || existingClick?.assetKind || null;

    const conversion = await prisma.$transaction(async (tx: any) => {
      const created = await tx.decisionRecommendationConversion.create({
        data: {
          sessionId: session.id,
          conversionType,
          conversionValue:
            body?.conversionValue === null || body?.conversionValue === undefined
              ? null
              : safeNumber(body.conversionValue, 0),
          assetId: finalAssetId,
          assetTitle: finalAssetTitle,
          assetHref: finalAssetHref,
          assetKind: finalAssetKind,
          metadata:
            body?.metadata && typeof body.metadata === "object" ? body.metadata : {},
        },
      });

      await tx.decisionRecommendationSession.update({
        where: { id: session.id },
        data: {
          converted: true,
          conversionType,
          conversionAt: new Date(),
        },
      });

      return created;
    });

    return NextResponse.json({
      success: true,
      conversionId: conversion.id,
      sessionKey: session.sessionKey,
      conversionType,
      assetId: finalAssetId,
    });
  } catch (error) {
    console.error("[STRATEGY_ROOM_CONVERSION_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to log conversion",
      },
      { status: 500 }
    );
  }
}