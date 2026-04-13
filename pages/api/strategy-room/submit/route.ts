/* app/api/strategy-room/submit/route.ts — app-router compatibility endpoint */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function toSafeObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fullName = String(body?.fullName || "").trim();
    const organisation = String(body?.organisation || "").trim();
    const dependencyLevel = String(body?.dependencyLevel || "").trim();
    const volatility = String(body?.volatility || "").trim();

    if (!fullName || !organisation) {
      return NextResponse.json(
        { error: "Identity and Organisation required." },
        { status: 400 },
      );
    }

    const safeBody = toSafeObject(body);
    const email =
      typeof safeBody.email === "string" ? safeBody.email.trim().toLowerCase() : "";
    const emailHash = email ? sha256(email) : null;

    const record = await prisma.strategyIntake.create({
      data: {
        fullName,
        organisation,
        dependencyLevel: dependencyLevel || "unknown",
        volatility: volatility || "unknown",
        payload: JSON.stringify({
          ...safeBody,
          source: safeBody.source || "strategy_room_submit_app",
          submittedAt: new Date().toISOString(),
        }),
        emailHash,
      },
    });

    return NextResponse.json(
      {
        success: true,
        intakeId: record.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[STRATEGY_ROOM_APP_SUBMIT_ERROR]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}