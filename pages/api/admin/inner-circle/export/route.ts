import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    // Get the dev password from environment
    const devPassword = process.env.DEV_ADMIN_PASSWORD;
    if (!devPassword) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // ✅ FIXED: Convert both to Uint8Array for TypeScript compatibility
    const a = new TextEncoder().encode(password || "");
    const b = new TextEncoder().encode(devPassword);

    // ✅ FIXED: Use proper type-safe comparison
    let isValid = false;
    
    if (a.length === b.length) {
      try {
        // This is the safe way that works with both Buffer and Uint8Array
        isValid = timingSafeEqual(
          Buffer.from(a.buffer, a.byteOffset, a.byteLength),
          Buffer.from(b.buffer, b.byteOffset, b.byteLength)
        );
      } catch {
        isValid = false;
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create a secure session token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const response = NextResponse.json({
      success: true,
      token,
      expires: expires.toISOString(),
    });

    // Set secure HTTP-only cookie
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires,
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}