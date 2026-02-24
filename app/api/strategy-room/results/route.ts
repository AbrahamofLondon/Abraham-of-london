// app/api/strategy-room/results/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Intake ID required" }, 
        { status: 400 }
      );
    }

    const record = await prisma.strategyIntake.findUnique({
      where: { id }
    });

    if (!record) {
      return NextResponse.json(
        { error: "Strategy intake not found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json(record);
    
  } catch (error) {
    console.error("[STRATEGY_RESULTS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to retrieve strategy results" }, 
      { status: 500 }
    );
  }
}