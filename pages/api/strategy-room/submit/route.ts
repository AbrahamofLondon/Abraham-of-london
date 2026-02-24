import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, organisation, dependencyLevel, volatility } = body;

    // Validate essential data
    if (!fullName || !organisation) {
      return NextResponse.json({ error: "Identity and Organisation required." }, { status: 400 });
    }

    // Create the record in Neon
    const record = await prisma.strategyIntake.create({
      data: {
        fullName,
        organisation,
        dependencyLevel,
        volatility,
        payload: body, // Store the raw data for future LLM analysis
      },
    });

    console.log(`🛡️ [STRATEGY_INTAKE]: Record created for ${fullName} (${record.id})`);

    return NextResponse.json({ 
      success: true, 
      intakeId: record.id 
    });
  } catch (error) {
    console.error("❌ [STRATEGY_SUBMIT_ERROR]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}