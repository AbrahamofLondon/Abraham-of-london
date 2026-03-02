import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; 
import { toggleInteraction } from "@/lib/db/interactions";

/**
 * 🏛️ Institutional Interaction Gateway
 * Handles LIKES and SAVES for the sovereign portfolio.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // 🛡️ Guard: Authentication Check
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required for vault access." }, 
        { status: 401 }
      );
    }

    const body = await req.json();
    const { slug, action } = body;

    // 🛡️ Guard: Parameter Validation
    if (!slug || !["like", "save"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid asset identifier or action." }, 
        { status: 400 }
      );
    }

    // Execution: Toggle the interaction in the database
    const result = await toggleInteraction(slug, action, session.user.email);

    return NextResponse.json({ 
      success: true, 
      action, 
      status: (result as any).deletedAt ? "removed" : "added" 
    });

  } catch (error) {
    console.error("Critical API Failure [Interactions]:", error);
    return NextResponse.json(
      { error: "Internal Server Error during vault sync." }, 
      { status: 500 }
    );
  }
}