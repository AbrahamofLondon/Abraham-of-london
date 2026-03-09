/* app/api/strategy-room/submit/route.ts — app-router compatibility endpoint */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fullName = String(body?.fullName || "").trim();
    const organisation = String(body?.organisation || "").trim();

    if (!fullName || !organisation) {
      return NextResponse.json(
        { error: "Identity and Organisation required." },
        { status: 400 }
      );
    }

    const record = await prisma.strategyIntake.create({
      data: {
        fullName,
        organisation,
        dependencyLevel: body?.dependencyLevel || null,
        volatility: body?.volatility || null,
        payload: {
          ...body,
          source: body?.source || "strategy_room_submit_app",
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        intakeId: record.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[STRATEGY_ROOM_APP_SUBMIT_ERROR]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}